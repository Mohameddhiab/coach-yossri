import type { SubscriptionStatus } from "@/shared/lib/domain";
import type { BadgeVariant } from "@/components/ui/badge";

export function statusBadge(status: SubscriptionStatus | null | undefined): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case "ACTIF":
      return { label: "نشط", variant: "active" };
    case "ESSAI":
      return { label: "تجريبي", variant: "trial" };
    case "EXPIRE_BIENTOT":
      return { label: "ينتهي قريباً", variant: "soon" };
    case "EXPIRE":
      return { label: "منتهي", variant: "expired" };
    default:
      return { label: "دون اشتراك", variant: "neutral" };
  }
}

export function lastWeightText(
  last_weight: { poids_kg: number; date: string } | null,
  days: number | null,
): string {
  if (!last_weight) return "لا يوجد وزن مسجّل";
  return days === null ? `—` : `منذ ${days} يومًا`;
}