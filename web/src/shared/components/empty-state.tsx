import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center ${className ?? ""}`.trim()}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <div className="font-semibold">{title}</div>
      {description && <div className="max-w-xs text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
