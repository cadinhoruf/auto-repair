interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
}

export function FormField({ label, error, id, ...props }: FormFieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium text-gray-700">
				{label}
			</label>
			<input
				id={id}
				className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
				{...props}
			/>
			{error ? <p className="text-xs text-red-600">{error}</p> : null}
		</div>
	);
}

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string;
	error?: string;
}

export function TextareaField({ label, error, id, ...props }: TextareaFieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium text-gray-700">
				{label}
			</label>
			<textarea
				id={id}
				rows={3}
				className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
				{...props}
			/>
			{error ? <p className="text-xs text-red-600">{error}</p> : null}
		</div>
	);
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label: string;
	options: { value: string; label: string }[];
}

export function SelectField({ label, options, id, ...props }: SelectFieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium text-gray-700">
				{label}
			</label>
			<select
				id={id}
				className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
				{...props}
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	);
}
