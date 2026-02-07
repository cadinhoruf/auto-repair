/**
 * Formata data no padrão brasileiro (dd/mm/yyyy).
 * Aceita Date, string ISO ou YYYY-MM-DD.
 */
export function formatDateBR(value: Date | string): string {
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * Converte string dd/mm/yyyy (ou dd-mm-yyyy) em YYYY-MM-DD para APIs/inputs.
 * Retorna "" se inválido.
 */
export function parseDateBR(str: string): string {
	const cleaned = str.replace(/\D/g, "");
	if (cleaned.length !== 8) return "";
	const d = cleaned.slice(0, 2);
	const m = cleaned.slice(2, 4);
	const y = cleaned.slice(4, 8);
	const day = Number.parseInt(d, 10);
	const month = Number.parseInt(m, 10);
	const year = Number.parseInt(y, 10);
	if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100)
		return "";
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
		return "";
	return `${y}-${m}-${d}`;
}

/**
 * Converte YYYY-MM-DD para string dd/mm/yyyy para exibir em input.
 */
export function isoToDisplayBR(iso: string): string {
	if (!iso || iso.length < 10) return "";
	const [y, m, d] = iso.slice(0, 10).split("-");
	if (!y || !m || !d) return "";
	return `${d}/${m}/${y}`;
}

/**
 * Aplica máscara dd/mm/yyyy enquanto o usuário digita (apenas números).
 */
export function maskDateBR(input: string): string {
	const digits = input.replace(/\D/g, "").slice(0, 8);
	if (digits.length <= 2) return digits;
	if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
	return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
