import { Card, CardContent } from "@/components/ui/card";
import { Flame, Drumstick, Wheat, Droplet } from "lucide-react";

export function MacrosCards({
  calories,
  proteines,
  glucides,
  lipides,
}: {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
}) {
  const items = [
    { label: "السعرات", value: calories, unit: "سعرة", icon: Flame, color: "text-amber-500", bg: "border-amber-500/20 bg-amber-500/5" },
    { label: "بروتين", value: proteines, unit: "غ", icon: Drumstick, color: "text-emerald-600", bg: "border-emerald-500/20 bg-emerald-500/5" },
    { label: "كربوهيدرات", value: glucides, unit: "غ", icon: Wheat, color: "text-sky-600", bg: "border-sky-500/20 bg-sky-500/5" },
    { label: "دهون", value: lipides, unit: "غ", icon: Droplet, color: "text-orange-500", bg: "border-orange-500/20 bg-orange-500/5" },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className={item.bg}>
          <CardContent className="flex items-center gap-3 p-3">
            <item.icon className={`size-5 shrink-0 ${item.color}`} />
            <div className="leading-tight">
              <div className="text-lg font-extrabold tabular-nums">
                {item.value}
                <span className="ms-1 text-xs font-medium text-muted-foreground">
                  {item.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}