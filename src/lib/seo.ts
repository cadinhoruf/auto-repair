/**
 * Constantes e helpers para SEO do projeto.
 */

export const SITE_NAME = "Mecânica Fácil";
export const SITE_DESCRIPTION =
	"Sistema de gestão para oficinas mecânicas: clientes, ordens de serviço, fluxo de caixa e orçamentos em PDF.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mecanica-facil.app";

export const defaultOpenGraph = {
	siteName: SITE_NAME,
	description: SITE_DESCRIPTION,
	type: "website" as const,
	locale: "pt_BR" as const,
};

export function titleTemplate(title: string): string {
	return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}
