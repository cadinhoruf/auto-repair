"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";

const registerSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});
type RegisterFormData = z.infer<typeof registerSchema>;

const loginSchema = z.object({
	email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
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
		defaultValues: { name: "", email: invitation?.email ?? "", password: "" },
	});

	// ── Formulário de login ────────────────────────────────
	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: invitation?.email ?? "", password: "" },
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
			const { error } = await authClient.signIn.email({
				email: data.email,
				password: data.password,
			});
			if (error) {
				setAcceptError(error.message ?? "Email ou senha inválidos.");
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
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 px-4 py-16 text-white">
				<p className="text-sm text-white/70">Carregando convite...</p>
			</main>
		);
	}

	if (error || !invitation) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 px-4 py-16 text-white">
				<div className="w-full max-w-md rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10 text-center">
					<h1 className="font-semibold text-xl">Convite Inválido</h1>
					<p className="mt-2 text-sm text-white/70">
						{error?.message ?? "Este convite não existe ou já foi utilizado."}
					</p>
					<button
						onClick={() => router.push("/")}
						className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
					>
						Ir para Login
					</button>
				</div>
			</main>
		);
	}

	if (invitation.status !== "pending") {
		return (
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 px-4 py-16 text-white">
				<div className="w-full max-w-md rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10 text-center">
					<h1 className="font-semibold text-xl">Convite Expirado</h1>
					<p className="mt-2 text-sm text-white/70">
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
						className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
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
			<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 px-4 py-16 text-white">
				<div className="w-full max-w-md rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10 text-center">
					<h1 className="font-semibold text-xl">Convite Expirado</h1>
					<p className="mt-2 text-sm text-white/70">
						Este convite expirou em{" "}
						{new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}.
						Peça um novo convite ao administrador.
					</p>
					<button
						onClick={() => router.push("/")}
						className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
					>
						Ir para Login
					</button>
				</div>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 px-4 py-16 text-white">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="mb-6 text-center">
					<div className="text-sm font-semibold tracking-wide text-white/80">
						Auto Repair
					</div>
					<div className="mt-1 text-xs text-white/60">
						Convite para organização
					</div>
				</div>

				<div className="rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10">
					{/* Detalhes do convite */}
					<div className="mb-5 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
						<p className="text-sm text-white/90">
							<span className="font-medium">{invitation.inviterName}</span>{" "}
							convidou você para a organização
						</p>
						<p className="mt-1 font-semibold text-lg text-white">
							{invitation.organizationName}
						</p>
						<p className="mt-1 text-xs text-white/60">
							Papel: {invitation.role === "admin" ? "Administrador" : "Membro"}
						</p>
					</div>

					{/* Já logado — aceitar direto */}
					{session?.user ? (
						<div>
							<p className="mb-3 text-sm text-white/80">
								Logado como{" "}
								<span className="font-medium text-white">
									{session.user.email}
								</span>
							</p>

							{acceptError ? (
								<div className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
									{acceptError}
								</div>
							) : null}

							<div className="flex gap-3">
								<button
									onClick={acceptInvitation}
									disabled={isAccepting}
									className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isAccepting ? "Aceitando..." : "Aceitar Convite"}
								</button>
								<button
									onClick={() => router.push("/dashboard")}
									className="inline-flex h-11 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/20"
								>
									Cancelar
								</button>
							</div>
						</div>
					) : (
						<div>
							{/* Toggle registro/login */}
							<div className="mb-4 flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
								<button
									type="button"
									className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
										mode === "register"
											? "bg-white/10 text-white"
											: "text-white/60 hover:text-white/80"
									}`}
									onClick={() => setMode("register")}
								>
									Criar Conta
								</button>
								<button
									type="button"
									className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
										mode === "login"
											? "bg-white/10 text-white"
											: "text-white/60 hover:text-white/80"
									}`}
									onClick={() => setMode("login")}
								>
									Já tenho conta
								</button>
							</div>

							{acceptError ? (
								<div className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
									{acceptError}
								</div>
							) : null}

							{mode === "register" ? (
								<form
									className="flex flex-col gap-4"
									onSubmit={registerForm.handleSubmit(onRegister)}
								>
									<div className="flex flex-col gap-2">
										<label
											className="text-sm font-medium"
											htmlFor="reg-name"
										>
											Nome
										</label>
										<input
											id="reg-name"
											className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
											placeholder="Seu nome"
											{...registerForm.register("name")}
										/>
										{registerForm.formState.errors.name ? (
											<p className="text-xs text-red-300">
												{registerForm.formState.errors.name.message}
											</p>
										) : null}
									</div>

									<div className="flex flex-col gap-2">
										<label
											className="text-sm font-medium"
											htmlFor="reg-email"
										>
											Email
										</label>
										<input
											id="reg-email"
											type="email"
											className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
											placeholder={invitation.email}
											defaultValue={invitation.email}
											{...registerForm.register("email")}
										/>
										{registerForm.formState.errors.email ? (
											<p className="text-xs text-red-300">
												{registerForm.formState.errors.email.message}
											</p>
										) : null}
									</div>

									<div className="flex flex-col gap-2">
										<label
											className="text-sm font-medium"
											htmlFor="reg-password"
										>
											Senha
										</label>
										<input
											id="reg-password"
											type="password"
											className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
											placeholder="Mínimo 6 caracteres"
											{...registerForm.register("password")}
										/>
										{registerForm.formState.errors.password ? (
											<p className="text-xs text-red-300">
												{registerForm.formState.errors.password.message}
											</p>
										) : null}
									</div>

									<button
										type="submit"
										disabled={registerForm.formState.isSubmitting}
										className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{registerForm.formState.isSubmitting
											? "Criando conta..."
											: "Criar Conta e Aceitar"}
									</button>
								</form>
							) : (
								<form
									className="flex flex-col gap-4"
									onSubmit={loginForm.handleSubmit(onLogin)}
								>
									<div className="flex flex-col gap-2">
										<label
											className="text-sm font-medium"
											htmlFor="login-email"
										>
											Email
										</label>
										<input
											id="login-email"
											type="email"
											className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
											placeholder="voce@exemplo.com"
											defaultValue={invitation.email}
											{...loginForm.register("email")}
										/>
										{loginForm.formState.errors.email ? (
											<p className="text-xs text-red-300">
												{loginForm.formState.errors.email.message}
											</p>
										) : null}
									</div>

									<div className="flex flex-col gap-2">
										<label
											className="text-sm font-medium"
											htmlFor="login-password"
										>
											Senha
										</label>
										<input
											id="login-password"
											type="password"
											className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
											placeholder="••••••••"
											{...loginForm.register("password")}
										/>
										{loginForm.formState.errors.password ? (
											<p className="text-xs text-red-300">
												{loginForm.formState.errors.password.message}
											</p>
										) : null}
									</div>

									<button
										type="submit"
										disabled={loginForm.formState.isSubmitting}
										className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{loginForm.formState.isSubmitting
											? "Entrando..."
											: "Entrar e Aceitar"}
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
