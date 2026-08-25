import { Card, CardContent } from "@/components/ui/card";
import { Flame, Drumstick, Wheat } from "lucide-react";

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
    { label: "السعرات", value: calories, unit: "سعرة", icon: Flame },
    { label: "بروتين", value: proteines, unit: "غ", icon: Drumstick },
    { label: "كربوهيدرات", value: glucides, unit: "غ", icon: Wheat },
    { label: "دهون", value: lipides, unit: "غ", icon: Flame },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-3">
            <item.icon className="size-5 shrink-0 text-primary" />
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