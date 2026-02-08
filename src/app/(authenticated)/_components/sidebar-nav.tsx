"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
	href: string;
	label: string;
};

type NavGroup = {
	group: string;
	links: NavLink[];
};

export function SidebarNav({ groups }: { groups: NavGroup[] }) {
	const pathname = usePathname();

	return (
		<nav className="flex flex-1 flex-col gap-6 p-3">
			{groups.map(({ group, links }) => (
				<div key={group}>
					<div className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
						{group}
					</div>
					<div className="flex flex-col gap-1">
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
					</div>
				</div>
			))}
		</nav>
	);
}
