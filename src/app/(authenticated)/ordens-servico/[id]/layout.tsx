import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Ordem de Serviço",
	description: "Detalhes e edição da ordem de serviço.",
};

export default function OSDetalheLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
