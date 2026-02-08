import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, defaultOpenGraph } from "@/lib/seo";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const viewport: Viewport = {
	themeColor: "#2563eb",
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	keywords: ["oficina mecânica", "gestão", "ordens de serviço", "fluxo de caixa", "orçamentos"],
	authors: [{ name: SITE_NAME }],
	creator: SITE_NAME,
	icons: [{ rel: "icon", url: "/favicon.ico" }],
	openGraph: {
		...defaultOpenGraph,
		url: SITE_URL,
		title: SITE_NAME,
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
	},
	robots: {
		index: true,
		follow: true,
	},
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="pt-BR">
			<body>
				<TRPCReactProvider>{children}</TRPCReactProvider>
				<Toaster richColors position="top-center" toastOptions={{ }}  />
			</body>
		</html>
	);
}
