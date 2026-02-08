import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Novo Usuário",
	description: "Cadastrar novo usuário.",
};

export default function NovoUsuarioLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
