"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import {
	ORG_EXTRA_ROLE_OPTIONS,
	ORG_MEMBER_ROLE_OPTIONS,
} from "@/lib/role-options";
import { type OrganizationFormData, organizationSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function EditarOrganizacaoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const utils = api.useUtils();

  const { data: org, isLoading } = api.organization.getById.useQuery({ id });
  const { data: invitations } = api.organization.listInvitations.useQuery({
    organizationId: id,
  });

  // ── Formulário de dados da organização ────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (org) {
      reset({ name: org.name, slug: org.slug });
    }
  }, [org, reset]);

  const update = api.organization.update.useMutation({
    onSuccess: async () => {
      await utils.organization.list.invalidate();
      await utils.organization.getById.invalidate({ id });
      router.push("/organizacoes");
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    update.mutate({ id, ...data });
  };

  // ── Gerenciamento de membros ──────────────────────────
  const updateRole = api.organization.updateMemberRole.useMutation({
    onSuccess: () => utils.organization.getById.invalidate({ id }),
  });

  const removeMember = api.organization.removeMember.useMutation({
    onSuccess: () => utils.organization.getById.invalidate({ id }),
  });

  // ── Convites ──────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inviteMember = api.organization.inviteMember.useMutation({
    onSuccess: async () => {
      setInviteEmail("");
      setInviteRole("member");
      await utils.organization.listInvitations.invalidate({
        organizationId: id,
      });
    },
  });

  const cancelInvitation = api.organization.cancelInvitation.useMutation({
    onSuccess: () =>
      utils.organization.listInvitations.invalidate({
        organizationId: id,
      }),
  });

  function getInviteLink(invitationId: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/convite/${invitationId}`;
  }

  async function copyLink(invitationId: string) {
    const url = getInviteLink(invitationId);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopiedId(invitationId);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }
    } catch {
      // clipboard API falhou (ex.: contexto não seguro em produção)
    }

    // Fallback: input temporário + execCommand (funciona em HTTP e contextos restritos)
    const input = document.createElement("input");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, url.length);
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      if (ok) {
        setCopiedId(invitationId);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }
    } catch {
      document.body.removeChild(input);
    }

    // Último recurso: exibir o link para o usuário copiar manualmente
    window.prompt("Copie o link do convite:", url);
  }

  if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;
  if (!org)
    return <p className="text-sm text-red-600">Organização não encontrada.</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar Organização" />

      {/* ── Dados da organização ── */}
      <form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="Nome *"
          id="name"
          placeholder="Nome da oficina"
          registration={register("name")}
          error={errors.name?.message}
        />
        <FormField
          label="Slug *"
          id="slug"
          placeholder="nome-da-oficina"
          registration={register("slug")}
          error={errors.slug?.message}
        />

        {update.error ? (
          <p className="text-sm text-red-600">{update.error.message}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/organizacoes")}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* ── Membros ── */}
      <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-base text-gray-900">
          Membros da Organização
        </h2>

        {org.members.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum membro nesta organização.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Papel</th>
                  <th className="px-4 py-2 font-medium text-gray-600">
                    Permissões
                  </th>
                  <th className="px-4 py-2 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {org.members.map((member) => {
                 	const hasFinanceiro = member.memberRoles?.some(
					(r) => r.role === "financeiro",
				) ?? false;
					const handleRoleChange = (role: "owner" | "admin" | "member") => {
						updateRole.mutate({
							memberId: member.id,
							role,
							extraRoles: hasFinanceiro ? ["financeiro"] : [],
						});
					};
					const handleFinanceiroChange = (checked: boolean) => {
						updateRole.mutate({
							memberId: member.id,
							role: member.role as "owner" | "admin" | "member",
							extraRoles: checked ? ["financeiro"] : [],
						});
					};
					return (
                  <tr key={member.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {member.user.name}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {member.user.email}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            e.target.value as "owner" | "admin" | "member",
                          )
                        }
                      >
                        {ORG_MEMBER_ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasFinanceiro}
                          onChange={(e) =>
                            handleFinanceiroChange(e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">
                          {ORG_EXTRA_ROLE_OPTIONS[0]?.label ?? "Financeiro"}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="danger"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          if (
                            confirm(
                              `Remover ${member.user.name} desta organização?`,
                            )
                          ) {
                            removeMember.mutate({ memberId: member.id });
                          }
                        }}
                        disabled={removeMember.isPending}
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
					);
                })}
              </tbody>
            </table>
          </div>
        )}

        {removeMember.error ? (
          <p className="mt-2 text-sm text-red-600">
            {removeMember.error.message}
          </p>
        ) : null}
      </section>

      {/* ── Convites ── */}
      <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-base text-gray-900">
          Convidar Membro
        </h2>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              htmlFor="inviteEmail"
              className="text-xs font-medium text-gray-600"
            >
              Email
            </label>
            <input
              id="inviteEmail"
              type="email"
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="usuario@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="inviteRole"
              className="text-xs font-medium text-gray-600"
            >
              Papel
            </label>
            <select
              id="inviteRole"
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              {ORG_MEMBER_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            disabled={!inviteEmail || inviteMember.isPending}
            onClick={() => {
              if (inviteEmail) {
                inviteMember.mutate({
                  organizationId: id,
                  email: inviteEmail,
                  role: inviteRole as "owner" | "admin" | "member",
                });
              }
            }}
          >
            {inviteMember.isPending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </div>

        {inviteMember.error ? (
          <p className="mt-2 text-sm text-red-600">
            {inviteMember.error.message}
          </p>
        ) : null}

        {/* Convites pendentes */}
        {invitations && invitations.length > 0 ? (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Convites Pendentes
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-600">
                      Papel
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-600">
                      Expira em
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2 text-gray-900">{inv.email}</td>
                      <td className="px-4 py-2">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {ORG_MEMBER_ROLE_OPTIONS.find((o) => o.value === inv.role)
                            ?.label ?? inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {formatDateBR(inv.expiresAt)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                            onClick={() => copyLink(inv.id)}
                          >
                            {copiedId === inv.id
                              ? "Copiado!"
                              : "Copiar Link"}
                          </Button>
                          <Button
                            variant="danger"
                            className="h-8 px-3 text-xs"
                            onClick={() => {
                              if (
                                confirm("Cancelar este convite?")
                              ) {
                                cancelInvitation.mutate({
                                  invitationId: inv.id,
                                });
                              }
                            }}
                            disabled={cancelInvitation.isPending}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {cancelInvitation.error ? (
          <p className="mt-2 text-sm text-red-600">
            {cancelInvitation.error.message}
          </p>
        ) : null}
      </section>

      {/* ── Informações ── */}
      <section className="max-w-lg rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-sm text-gray-700">Informações</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-700">ID:</span> {org.id}
          </p>
          <p>
            <span className="font-medium text-gray-700">Criada em:</span>{" "}
            {formatDateBR(org.createdAt)}
          </p>
          <p>
            <span className="font-medium text-gray-700">Total de membros:</span>{" "}
            {org.members.length}
          </p>
        </div>
      </section>
    </div>
  );
}
