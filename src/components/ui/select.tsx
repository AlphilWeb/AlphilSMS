// src/components/ui/select.tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export type SelectProps = {
  placeholder?: string;
  onValueChange: (value: string) => void;
  value?: string;
  children: React.ReactNode;
  className?: string;
  // Add the disabled prop here
  disabled?: boolean;
};

export function Select({ placeholder, onValueChange, value, children, className, disabled }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      {/* ... (SelectPrimitive.Trigger is correct) */}
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex h-10 w-full items-center justify-between rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm',
          'text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        disabled={disabled}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-emerald-600" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content 
          className={cn(
            'z-50 min-w-[8rem] rounded-lg border border-emerald-200 bg-white p-1 shadow-lg',
            'animate-in fade-in-80 ',
          )}
          // Remove the position="popper" prop
        >
          <SelectPrimitive.Viewport className="p-1">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export type SelectItemProps = {
  children: React.ReactNode;
  value: string;
  className?: string;
};

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className }, ref) => {
    return (
      <SelectPrimitive.Item
        ref={ref}
        value={value}
        className={cn(
          'relative flex cursor-pointer select-none items-center rounded-md py-1.5 px-2 pl-8',
          'text-sm text-gray-800 outline-none focus:bg-emerald-100 focus:text-emerald-900',
          'transition-colors data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
          className
        )}
      >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
          <Check className="h-4 w-4 text-emerald-600" />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  }
);

SelectItem.displayName = 'SelectItem';