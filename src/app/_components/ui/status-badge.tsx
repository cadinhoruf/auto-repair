const statusMap: Record<string, { label: string; className: string }> = {
   OPEN: { label: "Aberta", className: "bg-blue-100 text-blue-800" },
   IN_PROGRESS: { label: "Em andamento", className: "bg-yellow-100 text-yellow-800" },
   FINISHED: { label: "Finalizada", className: "bg-green-100 text-green-800" },
   IN: { label: "Entrada", className: "bg-green-100 text-green-800" },
   OUT: { label: "Saída", className: "bg-red-100 text-red-800" },
   PENDING: { label: "Pendente", className: "bg-gray-100 text-gray-800" },
   APPROVED: { label: "Aprovado", className: "bg-green-100 text-green-800" },
   REJECTED: { label: "Recusado", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: string }) {
   const info = statusMap[status] ?? { label: status, className: "bg-gray-100 text-gray-800" };
   return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}>
         {info.label}
      </span>
   );
}
