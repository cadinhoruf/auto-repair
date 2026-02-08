import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Nova OS",
	description: "Abrir nova ordem de serviço.",
};

export default function NovaOSLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
