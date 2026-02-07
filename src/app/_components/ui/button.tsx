import Link from "next/link";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
	primary: "bg-blue-600 text-white hover:bg-blue-700",
	secondary: "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50",
	danger: "bg-red-600 text-white hover:bg-red-700",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
	return (
		<button
			className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
			{...props}
		/>
	);
}

interface LinkButtonProps {
	href: string;
	variant?: Variant;
	children: React.ReactNode;
	className?: string;
}

export function LinkButton({ href, variant = "primary", children, className = "" }: LinkButtonProps) {
	return (
		<Link
			href={href}
			className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition ${variants[variant]} ${className}`}
		>
			{children}
		</Link>
	);
}
