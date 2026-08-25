"use client";

import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OFFRES, type SubscriptionTier } from "@/shared/lib/domain";
import { TierBadge } from "./tier-badge";

export function TierGate({
  require,
  tier,
  children,
}: {
  require: SubscriptionTier;
  tier?: SubscriptionTier | null;
  children: React.ReactNode;
}) {
  const rank = { BASIC: 1, PREMIUM: 2, ELITE: 3 } as const;
  if (tier && rank[tier] >= rank[require]) {
    return <>{children}</>;
  }
  return <UpsellCard require={require} />;
}

export function UpsellCard({ require }: { require: SubscriptionTier }) {
  const offre = OFFRES.find((o) => o.tier === require);
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle>
          هذه الميزة متاحة في اشتراك {offre?.nom ?? require}{" "}
          <Crown className="mb-1 inline h-4 w-4 text-amber-500" />
        </CardTitle>
        <CardDescription>بدّل اشتراكك مع المدرب واستفد بالخدمات الكاملة</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 text-center">
        {offre ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {offre.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        ) : null}
        <div className="text-lg font-bold">
          {offre?.prix} د.ت / شهر
        </div>
        <Button asChild>
          <Link href="/abonnement">اشتراكي</Link>
        </Button>
        <TierBadge tier={require} />
      </CardContent>
    </Card>
  );
}
