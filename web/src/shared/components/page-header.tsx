import type { ReactNode } from "react";
import { BackButton } from "@/shared/components/back-button";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: boolean | string;
}) {
  return (
    <div className="space-y-3">
      {back && (
        <div>
          <BackButton fallback={typeof back === "string" ? back : undefined} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
