"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";
import { type LoginFormData, loginSchema } from "@/lib/schemas";

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const callbackURL = useMemo(() => {
		const fromQuery = searchParams.get("callbackURL");
		return fromQuery && fromQuery.startsWith("/") ? fromQuery : "/dashboard";
	}, [searchParams]);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: true,
		},
	});

	const onSubmit = async (data: LoginFormData) => {
		setErrorMessage(null);
		try {
			const { error } = await authClient.signIn.email({
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
				callbackURL,
			});

			if (error) {
				setErrorMessage(error.message ?? "E-mail ou senha inválidos.");
				return;
			}

			router.push(callbackURL);
			router.refresh();
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Falha ao realizar login.",
			);
		}
	};

	return (
		<div className="w-full max-w-md rounded-2xl bg-white/5 p-6 shadow-sm ring-1 ring-white/10">
			<div className="flex flex-col gap-2">
				<h1 className="font-semibold text-2xl tracking-tight">Entrar</h1>
				<p className="text-sm text-white/70">
					Acesse o sistema usando seu e-mail e senha.
				</p>
			</div>

			<form
				className="mt-6 flex flex-col gap-4"
				onSubmit={handleSubmit(onSubmit)}
			>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium" htmlFor="email">
						E-mail
					</label>
					<input
						id="email"
						className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
						placeholder="voce@exemplo.com"
						autoComplete="email"
						inputMode="email"
						{...register("email")}
					/>
					{errors.email ? (
						<p className="text-xs text-red-300">{errors.email.message}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium" htmlFor="password">
						Senha
					</label>
					<input
						id="password"
						type="password"
						className="h-11 rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-white/30"
						placeholder="••••••••"
						autoComplete="current-password"
						{...register("password")}
					/>
					{errors.password ? (
						<p className="text-xs text-red-300">{errors.password.message}</p>
					) : null}
				</div>

				<label className="flex items-center gap-2 text-sm text-white/80">
					<input
						type="checkbox"
						className="size-4 rounded border-white/20 bg-white/10"
						{...register("rememberMe")}
					/>
					Manter conectado
				</label>

				{errorMessage ? (
					<div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
						{errorMessage}
					</div>
				) : null}

				<button
					type="submit"
					disabled={isSubmitting}
					className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting ? "Entrando..." : "Entrar"}
				</button>

				<p className="text-center text-sm text-white/60">
					Ainda não tem conta?{" "}
					<span className="text-white/80">
						Peça um convite ao administrador.
					</span>
				</p>
			</form>
		</div>
	);
}
