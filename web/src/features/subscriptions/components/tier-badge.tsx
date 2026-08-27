import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/shared/lib/domain";

const CONFIG: Record<SubscriptionTier, { label: string; className: string }> = {
  ONLINE: {
    label: "أونلاين",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-transparent",
  },
  PREMIUM_COACH: {
    label: "بريميوم كوش",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent",
  },
};

export function TierBadge({
  tier,
  className,
}: {
  tier?: SubscriptionTier | null;
  className?: string;
}) {
  const cfg = CONFIG[tier ?? "ONLINE"];
  return (
    <Badge variant="outline" className={cn("font-semibold", cfg.className, className)}>
      {cfg.label}
    </Badge>
  );
}
