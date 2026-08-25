"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";

export function ErrorState({
  title = "تعذّر تحميل البيانات",
  description = "حدث خطأ في الاتصال — حاول مرة أخرى.",
  onRetry,
  retrying,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <EmptyState
      icon={<TriangleAlert className="size-5 text-destructive" />}
      title={title}
      description={description}
      action={
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          {retrying ? <Loader2 className="size-4 animate-spin" /> : null}
          أعد المحاولة
        </Button>
      }
    />
  );
}
