import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Convite",
	description: `Aceitar convite para participar de uma organização no ${SITE_NAME}.`,
	robots: { index: false, follow: false },
};

export default function ConviteLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
