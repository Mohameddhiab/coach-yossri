import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/icons/icon-192.png"
        alt="Coach Yosri"
        width={36}
        height={36}
        priority
        className="rounded-xl"
      />
      {!compact && (
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-tight">
            Coach Yosri
          </div>
          <div className="text-xs text-muted-foreground">بالصحة والقوة مع مدربك</div>
        </div>
      )}
    </div>
  );
}