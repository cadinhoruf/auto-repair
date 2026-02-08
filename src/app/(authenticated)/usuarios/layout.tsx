import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Usuários",
	description: "Gestão de usuários do sistema.",
};

export default function UsuariosLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
