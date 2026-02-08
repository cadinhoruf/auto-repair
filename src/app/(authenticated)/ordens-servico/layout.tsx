import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Ordens de Serviço",
	description: "Listagem e acompanhamento das ordens de serviço.",
};

export default function OrdensServicoLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
