"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoachContactButtons({ telephone }: { telephone: string }) {
  const digits = telephone.replace(/[^\d]/g, "");
  const wa = digits.startsWith("216") ? digits : `216${digits}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <a href={`tel:${telephone}`}>
          <Phone />
          اتصال
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
          <MessageCircle />
          واتساب
        </a>
      </Button>
    </div>
  );
}
