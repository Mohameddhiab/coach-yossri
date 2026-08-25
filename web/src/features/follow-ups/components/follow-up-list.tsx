"use client";

import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { formatDate } from "@/lib/utils";
import { useMyFollowUps } from "@/features/follow-ups/hooks/useFollowUps";

export function FollowUpList() {
  const { data: rows, isLoading } = useMyFollowUps();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" />
          المتابعة الشخصية
        </CardTitle>
        <CardDescription>تقييمات المدرب وتعديلات البرنامج</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : !rows?.length ? (
          <EmptyState title="لا يوجد تقييمات حاليًا" description="المدرب ينشر هنا تقييماتك و تعديلاتك." />
        ) : (
          <div className="space-y-3">
            {[...rows]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((f) => (
                <div key={f.id} className="rounded-xl border border-border p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{f.periode}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm">{f.bilan}</p>
                  {f.ajustements ? (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-muted p-2 text-sm text-muted-foreground">
                      تعديلات : {f.ajustements}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
