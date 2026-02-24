import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide", {
  variants: {
    variant: {
      low: "bg-emerald-100 text-emerald-700",
      medium: "bg-amber-100 text-amber-700",
      high: "bg-red-100 text-red-700",
      success: "bg-emerald-100 text-emerald-700",
      warning: "bg-amber-100 text-amber-700",
      danger: "bg-red-100 text-red-700",
      info: "bg-indigo-100 text-indigo-700",
      secondary: "bg-slate-100 text-slate-700",
      outline: "border border-slate-200 bg-white text-slate-700",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
export default Badge;
