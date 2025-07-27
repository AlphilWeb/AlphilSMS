// src/components/ui/button.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className, 
  variant = "primary", 
  ...props 
}, ref) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm",
    outline: "border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
    ghost: "text-emerald-700 hover:bg-emerald-50"
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500",
        "focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };