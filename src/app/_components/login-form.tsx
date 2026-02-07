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
			username: "",
			password: "",
			rememberMe: true,
		},
	});

	const onSubmit = async (data: LoginFormData) => {
		setErrorMessage(null);
		try {
			const { error } = await authClient.signIn.username({
				username: data.username,
				password: data.password,
			});

			if (error) {
				setErrorMessage(
					error.message ?? "Usuário ou senha inválidos.",
				);
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
		<div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-gray-900">Entrar</h1>
				<p className="mt-1 text-sm text-gray-500">
					Usuário e senha
				</p>
			</div>

			<form
				className="flex flex-col gap-4"
				onSubmit={handleSubmit(onSubmit)}
			>
				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-gray-700" htmlFor="username">
						Usuário
					</label>
					<input
						id="username"
						className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
						placeholder="seu.usuario"
						autoComplete="username"
						{...register("username")}
					/>
					{errors.username ? (
						<p className="text-xs text-red-600">{errors.username.message}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-gray-700" htmlFor="password">
						Senha
					</label>
					<input
						id="password"
						type="password"
						className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
						placeholder="••••••••"
						autoComplete="current-password"
						{...register("password")}
					/>
					{errors.password ? (
						<p className="text-xs text-red-600">{errors.password.message}</p>
					) : null}
				</div>

				<label className="flex items-center gap-2 text-sm text-gray-600">
					<input
						type="checkbox"
						className="size-4 rounded border-gray-300 text-sky-600 focus:ring-sky-400"
						{...register("rememberMe")}
					/>
					Manter conectado
				</label>

				{errorMessage ? (
					<div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
						{errorMessage}
					</div>
				) : null}

				<button
					type="submit"
					disabled={isSubmitting}
					className="mt-1 h-10 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting ? "Entrando..." : "Entrar"}
				</button>

				<p className="text-center text-sm text-gray-500">
					Sem conta? Peça um convite ao administrador.
				</p>
			</form>
		</div>
	);
}
