"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ fallback = "/users" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ms-2 text-muted-foreground"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <ArrowRight className="size-4" />
      رجوع
    </Button>
  );
}