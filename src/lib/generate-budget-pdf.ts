import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface BudgetItem {
	description: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

interface BudgetPdfData {
	organizationName: string;
	number: string;
	issuedAt: string | Date;
	clientName: string;
	clientPhone?: string;
	clientEmail?: string;
	clientDocument?: string;
	serviceOrderDescription?: string;
	notes?: string;
	items: BudgetItem[];
	totalAmount: number;
}

function formatCurrency(value: number): string {
	return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: string | Date): string {
	return new Date(date).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

export function generateBudgetPdf(data: BudgetPdfData) {
	const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 20;
	const contentWidth = pageWidth - margin * 2;
	let y = 20;

	// ── Cores ──────────────────────────────────────────────
	const primary = [22, 72, 255] as const; // #1648ff (blue-600)
	const gray900 = [17, 24, 39] as const;
	const gray600 = [75, 85, 99] as const;
	const gray400 = [156, 163, 175] as const;

	// ── Header com faixa colorida ──────────────────────────
	doc.setFillColor(...primary);
	doc.rect(0, 0, pageWidth, 38, "F");

	doc.setTextColor(255, 255, 255);
	doc.setFontSize(18);
	doc.setFont("helvetica", "bold");
	doc.text(data.organizationName, margin, y);

	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.text("Orçamento", margin, y + 6);

	// Número e data (alinhado à direita)
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text(data.number, pageWidth - margin, y, { align: "right" });

	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.text(formatDate(data.issuedAt), pageWidth - margin, y + 6, {
		align: "right",
	});

	y = 48;

	// ── Dados do cliente ───────────────────────────────────
	doc.setFillColor(249, 250, 251); // gray-50
	doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "F");

	doc.setTextColor(...gray400);
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("CLIENTE", margin + 5, y + 6);

	doc.setTextColor(...gray900);
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text(data.clientName, margin + 5, y + 13);

	// Detalhes do cliente na mesma linha
	const clientDetails: string[] = [];
	if (data.clientPhone) clientDetails.push(data.clientPhone);
	if (data.clientEmail) clientDetails.push(data.clientEmail);
	if (data.clientDocument) clientDetails.push(data.clientDocument);

	if (clientDetails.length > 0) {
		doc.setTextColor(...gray600);
		doc.setFontSize(8);
		doc.setFont("helvetica", "normal");
		doc.text(clientDetails.join("  |  "), margin + 5, y + 19);
	}

	y += 34;

	// ── OS vinculada (se houver) ───────────────────────────
	if (data.serviceOrderDescription) {
		doc.setTextColor(...gray400);
		doc.setFontSize(8);
		doc.setFont("helvetica", "bold");
		doc.text("ORDEM DE SERVIÇO", margin, y);
		y += 5;

		doc.setTextColor(...gray600);
		doc.setFontSize(9);
		doc.setFont("helvetica", "normal");
		const osLines = doc.splitTextToSize(
			data.serviceOrderDescription,
			contentWidth,
		);
		doc.text(osLines, margin, y);
		y += osLines.length * 4 + 6;
	}

	// ── Tabela de itens ────────────────────────────────────
	doc.setTextColor(...gray400);
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("ITENS / SERVIÇOS", margin, y);
	y += 4;

	const tableBody = data.items.map((item, index) => [
		String(index + 1),
		item.description,
		String(item.quantity),
		formatCurrency(item.unitPrice),
		formatCurrency(item.totalPrice),
	]);

	autoTable(doc, {
		startY: y,
		margin: { left: margin, right: margin },
		head: [["#", "Descrição", "Qtd", "Preço Unit.", "Total"]],
		body: tableBody,
		foot: [["", "", "", "TOTAL", formatCurrency(data.totalAmount)]],
		theme: "plain",
		styles: {
			fontSize: 9,
			cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
			textColor: [17, 24, 39],
			lineColor: [229, 231, 235], // gray-200
			lineWidth: 0.3,
		},
		headStyles: {
			fillColor: [243, 244, 246], // gray-100
			textColor: [75, 85, 99],
			fontStyle: "bold",
			fontSize: 8,
		},
		footStyles: {
			fillColor: [243, 244, 246],
			textColor: [17, 24, 39],
			fontStyle: "bold",
			fontSize: 10,
		},
		columnStyles: {
			0: { cellWidth: 10, halign: "center" },
			1: { cellWidth: "auto" },
			2: { cellWidth: 16, halign: "center" },
			3: { cellWidth: 30, halign: "right" },
			4: { cellWidth: 30, halign: "right" },
		},
		didDrawPage: () => {
			// Footer em cada página
			const pageHeight = doc.internal.pageSize.getHeight();
			doc.setTextColor(...gray400);
			doc.setFontSize(7);
			doc.setFont("helvetica", "normal");
			doc.text(
				`${data.number} — Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
				pageWidth / 2,
				pageHeight - 10,
				{ align: "center" },
			);
		},
	});

	// Pega a posição Y após a tabela
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	y = (doc as any).lastAutoTable?.finalY ?? y + 40;
	y += 8;

	// ── Observações (se houver) ────────────────────────────
	if (data.notes) {
		doc.setTextColor(...gray400);
		doc.setFontSize(8);
		doc.setFont("helvetica", "bold");
		doc.text("OBSERVAÇÕES", margin, y);
		y += 5;

		doc.setTextColor(...gray600);
		doc.setFontSize(9);
		doc.setFont("helvetica", "normal");
		const notesLines = doc.splitTextToSize(data.notes, contentWidth);
		doc.text(notesLines, margin, y);
		y += notesLines.length * 4 + 10;
	}

	// ── Linha de assinatura ────────────────────────────────
	const signatureY = Math.max(y + 15, 230);
	if (signatureY < doc.internal.pageSize.getHeight() - 30) {
		doc.setDrawColor(...gray400);
		doc.setLineWidth(0.3);

		const sigWidth = 70;
		const sigX1 = margin;
		const sigX2 = pageWidth - margin - sigWidth;

		doc.line(sigX1, signatureY, sigX1 + sigWidth, signatureY);
		doc.line(sigX2, signatureY, sigX2 + sigWidth, signatureY);

		doc.setTextColor(...gray400);
		doc.setFontSize(8);
		doc.setFont("helvetica", "normal");
		doc.text("Cliente", sigX1 + sigWidth / 2, signatureY + 5, {
			align: "center",
		});
		doc.text("Responsável", sigX2 + sigWidth / 2, signatureY + 5, {
			align: "center",
		});
	}

	return doc;
}

/**
 * Gera o PDF e abre em uma nova aba do navegador.
 */
export function openBudgetPdf(data: BudgetPdfData) {
	const doc = generateBudgetPdf(data);
	const blob = doc.output("blob");
	const url = URL.createObjectURL(blob);
	window.open(url, "_blank");
}

/**
 * Gera o PDF e retorna como Blob (para compartilhamento).
 */
export function getBudgetPdfBlob(data: BudgetPdfData): Blob {
	const doc = generateBudgetPdf(data);
	return doc.output("blob");
}
