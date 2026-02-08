import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Editar Cliente",
	description: "Editar dados do cliente.",
};

export default function EditarClienteLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
