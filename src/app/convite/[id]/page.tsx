"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { formatDateBR } from "@/lib/date-br";
import { api } from "@/trpc/react";

const registerSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	username: z
		.string()
		.min(3, "Usuário deve ter pelo menos 3 caracteres")
		.max(30, "Usuário deve ter no máximo 30 caracteres")
		.regex(
			/^[a-zA-Z0-9_.]+$/,
			"Usuário deve conter apenas letras, números, pontos e underscores",
		),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});
type RegisterFormData = z.infer<typeof registerSchema>;

const loginSchema = z.object({
	username: z.string().min(1, "Usuário é obrigatório"),
	password: z.string().min(1, "Senha é obrigatória"),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function ConvitePage() {
	const { id: invitationId } = useParams<{ id: string }>();
	const router = useRouter();

	const { data: session } = authClient.useSession();
	const { data: invitation, isLoading, error } =
		api.organization.getInvitation.useQuery({ id: invitationId });

	const [mode, setMode] = useState<"register" | "login">("register");
	const [acceptError, setAcceptError] = useState<string | null>(null);
	const [isAccepting, setIsAccepting] = useState(false);

	const acceptMutation = api.organization.acceptInvitation.useMutation();

	// ── Formulário de registro ─────────────────────────────
	const registerForm = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		defaultValues: { name: "", username: "", email: "", password: "" },
	});

	// Preenche o email automaticamente quando o convite carrega
	useEffect(() => {
		if (invitation?.email) {
			registerForm.setValue("email", invitation.email);
		}
	}, [invitation?.email, registerForm]);

	// ── Formulário de login ────────────────────────────────
	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { username: "", password: "" },
	});

	// ── Aceitar convite ────────────────────────────────────
	async function acceptInvitation() {
		setAcceptError(null);
		setIsAccepting(true);
		try {
			await acceptMutation.mutateAsync({ invitationId });
			router.push("/dashboard");
			router.refresh();
		} catch (err) {
			setAcceptError(
				err instanceof Error ? err.message : "Erro ao aceitar convite.",
			);
			setIsAccepting(false);
		}
	}

	// ── Registrar + aceitar ────────────────────────────────
	async function onRegister(data: RegisterFormData) {
		setAcceptError(null);
		try {
			const { error } = await authClient.signUp.email({
				name: data.name,
				username: data.username,
				email: data.email,
				password: data.password,
			});
			if (error) {
				setAcceptError(error.message ?? "Erro ao criar conta.");
				return;
			}
			// Após registro, aceitar convite
			await acceptInvitation();
		} catch (err) {
			setAcceptError(
				err instanceof Error ? err.message : "Erro ao criar conta.",
			);
		}
	}

	// ── Login + aceitar ────────────────────────────────────
	async function onLogin(data: LoginFormData) {
		setAcceptError(null);
		try {
			const { error } = await authClient.signIn.username({
				username: data.username,
				password: data.password,
			});
			if (error) {
				setAcceptError(error.message ?? "Usuário ou senha inválidos.");
				return;
			}
			// Após login, aceitar convite
			await acceptInvitation();
		} catch (err) {
			setAcceptError(
				err instanceof Error ? err.message : "Erro ao fazer login.",
			);
		}
	}

	// ── Estados de carregamento/erro ───────────────────────
	if (isLoading) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-blue-50 px-4 py-16">
				<p className="text-sm text-gray-500">Carregando convite...</p>
			</main>
		);
	}

	if (error || !invitation) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-blue-50 px-4 py-16">
				<div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
					<h1 className="font-semibold text-lg text-gray-900">Convite inválido</h1>
					<p className="mt-2 text-sm text-gray-500">
						{error?.message ?? "Este convite não existe ou já foi utilizado."}
					</p>
					<button
						onClick={() => router.push("/")}
						className="mt-6 inline-flex h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500"
					>
						Ir para Login
					</button>
				</div>
			</main>
		);
	}

	if (invitation.status !== "pending") {
		return (
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-blue-50 px-4 py-16">
				<div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
					<h1 className="font-semibold text-lg text-gray-900">Convite encerrado</h1>
					<p className="mt-2 text-sm text-gray-500">
						Este convite já foi{" "}
						{invitation.status === "accepted"
							? "aceito"
							: invitation.status === "rejected"
								? "rejeitado"
								: "cancelado"}
						.
					</p>
					<button
						onClick={() => router.push("/")}
						className="mt-6 inline-flex h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500"
					>
						Ir para Login
					</button>
				</div>
			</main>
		);
	}

	const isExpired = new Date(invitation.expiresAt) < new Date();
	if (isExpired) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-blue-50 px-4 py-16">
				<div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
					<h1 className="font-semibold text-lg text-gray-900">Convite expirado</h1>
					<p className="mt-2 text-sm text-gray-500">
						Expirado em{" "}
						{formatDateBR(invitation.expiresAt)}.
						Peça um novo convite ao administrador.
					</p>
					<button
						onClick={() => router.push("/")}
						className="mt-6 inline-flex h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500"
					>
						Ir para Login
					</button>
				</div>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-blue-50 px-4 py-16">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<div className="text-sm font-semibold tracking-wide text-sky-700">
						Mecânica Fácil
					</div>
					<div className="mt-1 text-xs text-gray-500">
						Convite para organização
					</div>
				</div>

				<div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
					<div className="mb-5 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
						<p className="text-sm text-gray-600">
							<span className="font-medium text-gray-900">{invitation.inviterName}</span>{" "}
							convidou você para
						</p>
						<p className="mt-1 font-semibold text-gray-900">
							{invitation.organizationName}
						</p>
						<p className="mt-1 text-xs text-gray-500">
							Papel: {invitation.role === "admin" ? "Administrador" : "Membro"}
						</p>
					</div>

					{session?.user ? (
						<div>
							<p className="mb-3 text-sm text-gray-600">
								Logado como{" "}
								<span className="font-medium text-gray-900">
									{session.user.email}
								</span>
							</p>

							{acceptError ? (
								<div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
									{acceptError}
								</div>
							) : null}

							<div className="flex gap-3">
								<button
									onClick={acceptInvitation}
									disabled={isAccepting}
									className="flex-1 h-10 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isAccepting ? "Aceitando..." : "Aceitar convite"}
								</button>
								<button
									onClick={() => router.push("/dashboard")}
									className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
								>
									Cancelar
								</button>
							</div>
						</div>
					) : (
						<div>
							<div className="mb-4 flex rounded-lg border border-gray-200 p-1 bg-gray-50/80">
								<button
									type="button"
									className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
										mode === "register"
											? "bg-white text-gray-900 shadow-sm"
											: "text-gray-600 hover:text-gray-900"
									}`}
									onClick={() => setMode("register")}
								>
									Criar conta
								</button>
								<button
									type="button"
									className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
										mode === "login"
											? "bg-white text-gray-900 shadow-sm"
											: "text-gray-600 hover:text-gray-900"
									}`}
									onClick={() => setMode("login")}
								>
									Já tenho conta
								</button>
							</div>

							{acceptError ? (
								<div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
									{acceptError}
								</div>
							) : null}

							{mode === "register" ? (
								<form
									className="flex flex-col gap-4"
									onSubmit={registerForm.handleSubmit(onRegister)}
								>
									<div className="flex flex-col gap-1.5">
										<label className="text-sm font-medium text-gray-700" htmlFor="reg-name">Nome</label>
										<input
											id="reg-name"
											className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
											placeholder="Seu nome"
											{...registerForm.register("name")}
										/>
										{registerForm.formState.errors.name ? (
											<p className="text-xs text-red-600">{registerForm.formState.errors.name.message}</p>
										) : null}
									</div>

									<div className="flex flex-col gap-1.5">
										<label className="text-sm font-medium text-gray-700" htmlFor="reg-username">Usuário</label>
										<input
											id="reg-username"
											className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
											placeholder="nome.sobrenome"
											{...registerForm.register("username")}
										/>
										{registerForm.formState.errors.username ? (
											<p className="text-xs text-red-600">{registerForm.formState.errors.username.message}</p>
										) : null}
									</div>

									<div className="flex flex-col gap-1.5">
										<label className="text-sm font-medium text-gray-700" htmlFor="reg-email">Email</label>
										<input
											id="reg-email"
											type="email"
											readOnly
											className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none"
											value={invitation.email}
											{...registerForm.register("email")}
										/>
										<p className="text-xs text-gray-500">Email do convite</p>
									</div>

									<div className="flex flex-col gap-1.5">
										<label className="text-sm font-medium text-gray-700" htmlFor="reg-password">Senha</label>
										<input
											id="reg-password"
											type="password"
											className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
											placeholder="Mínimo 6 caracteres"
											{...registerForm.register("password")}
										/>
										{registerForm.formState.errors.password ? (
											<p className="text-xs text-red-600">{registerForm.formState.errors.password.message}</p>
										) : null}
									</div>

									<button
										type="submit"
										disabled={registerForm.formState.isSubmitting}
										className="mt-1 h-10 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{registerForm.formState.isSubmitting ? "Criando conta..." : "Criar conta e aceitar"}
									</button>
								</form>
							) : (
								<form
									className="flex flex-col gap-4"
									onSubmit={loginForm.handleSubmit(onLogin)}
								>
									<div className="flex flex-col gap-1.5">
										<label className="text-sm font-medium text-gray-700" htmlFor="login-username">Usuário</label>
										<input
											id="login-username"
											className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
											placeholder="seu.usuario"
											{...loginForm.register("username")}
										/>
										{loginForm.formState.errors.username ? (
											<p className="text-xs text-red-600">{loginForm.formState.errors.username.message}</p>
										) : null}
									</div>

									<div className="flex flex-col gap-1.5">
										<label className="text-sm font-medium text-gray-700" htmlFor="login-password">Senha</label>
										<input
											id="login-password"
											type="password"
											className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
											placeholder="••••••••"
											{...loginForm.register("password")}
										/>
										{loginForm.formState.errors.password ? (
											<p className="text-xs text-red-600">{loginForm.formState.errors.password.message}</p>
										) : null}
									</div>

									<button
										type="submit"
										disabled={loginForm.formState.isSubmitting}
										className="mt-1 h-10 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{loginForm.formState.isSubmitting ? "Entrando..." : "Entrar e aceitar"}
									</button>
								</form>
							)}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
