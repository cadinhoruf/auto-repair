"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
	href: string;
	label: string;
};

export function SidebarNav({ links }: { links: NavLink[] }) {
	const pathname = usePathname();

	return (
		<nav className="flex flex-1 flex-col gap-1 p-3">
			{links.map((link) => {
				const isActive =
					pathname === link.href || pathname.startsWith(`${link.href}/`);
				return (
					<Link
						key={link.href}
						href={link.href}
						className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
							isActive
								? "bg-blue-100 text-blue-800 hover:bg-blue-100"
								: "text-gray-700 hover:bg-gray-100"
						}`}
					>
						{link.label}
					</Link>
				);
			})}
		</nav>
	);
}
