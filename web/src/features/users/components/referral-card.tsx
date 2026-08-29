"use client";

import { Gift, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/features/users/hooks/useUsers";
import type { User } from "@/shared/lib/domain";

export function ReferralCard({ user }: { user: User }) {
  const { data: users, isLoading } = useUsers("", "TOUS");

  if (isLoading) {
    return <Skeleton className="h-20 rounded-xl" />;
  }

  const parrain = user.referred_by
    ? users?.find((u) => u.id === user.referred_by)
    : null;
  const filleuls = users?.filter((u) => u.referred_by === user.id).length ?? 0;

  if (!parrain && filleuls === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Gift className="size-4 text-primary" />
          برنامج الإحالة
        </div>
        {parrain && (
          <div className="text-muted-foreground">
            تمت إحالة هذا المشترك بواسطة:{" "}
            <span className="font-bold text-foreground">
              {parrain.prenom} {parrain.nom}
            </span>
          </div>
        )}
        {filleuls > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4 text-primary" />
            قام بدعوة: <span className="font-bold text-foreground">{filleuls}</span>{" "}
            {filleuls === 1 ? "مشترك واحد" : "مشتركين"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}