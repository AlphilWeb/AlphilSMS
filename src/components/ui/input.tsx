// src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm text-gray-800",
        "ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-2",
        "focus:ring-emerald-500 focus:border-emerald-500 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };