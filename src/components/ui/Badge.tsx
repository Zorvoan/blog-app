import { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variants = {
  default: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  danger: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
