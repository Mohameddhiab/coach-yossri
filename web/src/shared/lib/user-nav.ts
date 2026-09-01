import {
  Dumbbell,
  MessagesSquare,
  Scale,
  Settings,
  Ticket,
  Trophy,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { SubscriptionTier } from "@/shared/lib/domain";

export interface UserNavItem {
  href: string;
  label: string;
  icon: typeof Users;
}

const BASE_NAV: UserNavItem[] = [
  { href: "/progression", label: "تقدّمي", icon: Scale },
  { href: "/profil", label: "الملف الشخصي", icon: UserRound },
  { href: "/abonnement", label: "الاشتراك", icon: Ticket },
  { href: "/reglages", label: "الإعدادات", icon: Settings },
];

const PLAN_NAV: UserNavItem[] = [
  { href: "/plan", label: "الوجبات", icon: UtensilsCrossed },
  { href: "/exercices", label: "التمارين", icon: Dumbbell },
  { href: "/ligue", label: "الدوري", icon: Trophy },
];

export function navForTier(tier: SubscriptionTier | null): UserNavItem[] {
  if (tier === "PREMIUM_COACH") {
    return [
      ...PLAN_NAV,
      { href: "/messages", label: "الرسائل", icon: MessagesSquare },
      ...BASE_NAV.slice(0, 3),
    ];
  }
  if (tier === "ONLINE") {
    return [...PLAN_NAV, ...BASE_NAV];
  }
  return [...BASE_NAV];
}
