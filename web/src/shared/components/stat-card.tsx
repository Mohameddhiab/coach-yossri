import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30",
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        {icon && (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-2xl font-black tracking-tight tabular-nums text-foreground">
            {value}
          </div>
          {hint && (
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {hint}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}