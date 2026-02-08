import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Editar Usuário",
	description: "Editar dados do usuário.",
};

export default function EditarUsuarioLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
