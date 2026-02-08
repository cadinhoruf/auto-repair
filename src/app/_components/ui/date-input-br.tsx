"use client";

import { useEffect, useState } from "react";
import { isoToDisplayBR, maskDateBR, parseDateBR } from "@/lib/date-br";

interface DateInputBRProps {
	id?: string;
	/** Se omitido ou vazio, o label não é exibido (útil em tabelas). */
	label?: string;
	error?: string;
	value: string; // YYYY-MM-DD
	onChange: (value: string) => void; // envia YYYY-MM-DD
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

/**
 * Input de data no formato brasileiro (dd/mm/yyyy).
 * value e onChange usam YYYY-MM-DD para compatibilidade com formulários e API.
 */
export function DateInputBR({
	id,
	label,
	error,
	value,
	onChange,
	placeholder = "dd/mm/aaaa",
	className = "",
	disabled,
}: DateInputBRProps) {
	const isoDisplay = value ? isoToDisplayBR(value) : "";
	const [local, setLocal] = useState(isoDisplay);

	// Sincroniza exibição quando o value externo muda (ex.: defaultValues do form)
	useEffect(() => {
		setLocal(isoDisplay);
	}, [isoDisplay]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = maskDateBR(e.target.value);
		setLocal(masked);
		if (masked === "") {
			onChange("");
			return;
		}
		const iso = parseDateBR(masked);
		if (iso) onChange(iso);
	};

	const handleBlur = () => {
		const iso = parseDateBR(local);
		if (iso) {
			onChange(iso);
			setLocal(isoToDisplayBR(iso));
		} else if (local.trim() === "") {
			onChange("");
			setLocal("");
		} else {
			setLocal(isoDisplay);
		}
	};

	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			{label ? (
				<label htmlFor={id} className="text-sm font-medium text-gray-700">
					{label}
				</label>
			) : null}
			<input
				id={id}
				type="text"
				inputMode="numeric"
				autoComplete="off"
				placeholder={placeholder}
				value={local}
				onChange={handleChange}
				onBlur={handleBlur}
				disabled={disabled}
				className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
			/>
			{error ? <p className="text-xs text-red-600">{error}</p> : null}
		</div>
	);
}
