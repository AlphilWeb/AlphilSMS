// src/components/ui/badge.tsx
import { cn } from "@/lib/utils";

export function Badge({ 
  children, 
  variant = "default", 
  className 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "danger"; 
  className?: string 
}) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";

  const variants = {
    default: "bg-emerald-100 text-emerald-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800"
  };

  return <span className={cn(base, variants[variant], className)}>{children}</span>;
}