"use client";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-4xl">😕</div>
      <h1 className="text-xl font-extrabold">صار خطأ ما</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        تعذر عرض الصفحة. حاول مرة أخرى — وإذا استمر الخطأ تواصل مع المدرب.
      </p>
      <Button onClick={reset}>أعد المحاولة</Button>
    </div>
  );
}