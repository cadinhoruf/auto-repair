/**
 * Formata um valor como telefone brasileiro.
 * (XX) XXXXX-XXXX (celular, 11 dígitos) ou (XX) XXXX-XXXX (fixo, 10 dígitos)
 */
export function formatPhone(value: string): string {
	const digits = value.replace(/\D/g, "").slice(0, 11);

	if (digits.length <= 2) return digits.length ? `(${digits}` : "";
	if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	if (digits.length <= 10)
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Converte um telefone brasileiro para o formato internacional do WhatsApp.
 * Ex: "(11) 99999-9999" → "5511999999999"
 * Retorna null se o número não tiver dígitos suficientes.
 */
export function toWhatsAppNumber(phone: string): string | null {
	const digits = phone.replace(/\D/g, "");

	// Já tem código do país
	if (digits.startsWith("55") && digits.length >= 12) return digits;

	// Número brasileiro (10 ou 11 dígitos)
	if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;

	return null;
}

/**
 * Gera a URL do WhatsApp para enviar uma mensagem.
 */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
	const number = toWhatsAppNumber(phone);
	if (!number) return null;
	return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
