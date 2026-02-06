export function EmptyState({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
			<p className="text-sm text-gray-500">{message}</p>
		</div>
	);
}
