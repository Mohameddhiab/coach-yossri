import {
  CalendarCheck,
  MessagesSquare,
  Scale,
  Settings,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import type { SubscriptionTier } from "@/shared/lib/domain";

export interface UserNavItem {
  href: string;
  label: string;
  icon: typeof Users;
}

const BASE_NAV: UserNavItem[] = [
  { href: "/progression", label: "تقدّمي", icon: Scale },
  { href: "/profil", label: "ملفي", icon: UserRound },
  { href: "/abonnement", label: "اشتراكي", icon: Ticket },
  { href: "/reglages", label: "الإعدادات", icon: Settings },
];

export function navForTier(tier: SubscriptionTier | null): UserNavItem[] {
  if (tier === "PREMIUM_COACH") {
    return [
      { href: "/plan", label: "خطتي", icon: CalendarCheck },
      { href: "/messages", label: "رسائل", icon: MessagesSquare },
      ...BASE_NAV.slice(0, 3),
    ];
  }
  if (tier === "ONLINE") {
    return [{ href: "/plan", label: "خطتي", icon: CalendarCheck }, ...BASE_NAV];
  }
  return [...BASE_NAV];
}
