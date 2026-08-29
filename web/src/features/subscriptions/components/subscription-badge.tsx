import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/shared/lib/domain";
import { cn } from "@/lib/utils";

const CONFIG: Record<SubscriptionStatus, { label: string; className: string }> = {
  ACTIF: { label: "نشط", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent" },
  EXPIRE_BIENTOT: { label: "ينتهي قريباً", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent" },
  EXPIRE: { label: "منتهي", className: "bg-destructive/12 text-destructive border-transparent" },
};

export function SubscriptionBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  const cfg = CONFIG[status] ?? CONFIG.EXPIRE;
  return (
    <Badge variant="outline" className={cn("font-semibold", cfg.className, className)}>
      {cfg.label}
    </Badge>
  );
}