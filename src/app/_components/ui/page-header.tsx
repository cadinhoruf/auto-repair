import Link from "next/link";
import type { ReactNode } from "react";

export interface PageHeaderProps {
	title: string;
	actionLabel?: string;
	actionHref?: string;
	action?: ReactNode;
}

export function PageHeader({ title, actionLabel, actionHref, action }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<h1 className="font-semibold text-2xl tracking-tight text-gray-900">
				{title}
			</h1>
			{action ??
				(actionLabel && actionHref ? (
					<Link
						href={actionHref}
						className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700"
					>
						{actionLabel}
					</Link>
				) : null)}
		</div>
	);
}
