import React from "react";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface FormFieldWrapperProps {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
}

export function FormFieldWrapper({
  label,
  error,
  className,
  children,
  icon: Icon,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
