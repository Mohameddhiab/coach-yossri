import { Flame, Drumstick, Wheat, Droplet } from "lucide-react";

const ITEMS = [
  { key: "cal", label: "السعرات", unit: "سعرة", icon: Flame, color: "text-amber-500", ring: "ring-amber-500/20", bg: "bg-gradient-to-br from-amber-500/10 to-amber-500/5" },
  { key: "pro", label: "بروتين", unit: "غ", icon: Drumstick, color: "text-emerald-600", ring: "ring-emerald-500/20", bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" },
  { key: "glu", label: "كربوهيدرات", unit: "غ", icon: Wheat, color: "text-sky-600", ring: "ring-sky-500/20", bg: "bg-gradient-to-br from-sky-500/10 to-sky-500/5" },
  { key: "lip", label: "دهون", unit: "غ", icon: Droplet, color: "text-orange-500", ring: "ring-orange-500/20", bg: "bg-gradient-to-br from-orange-500/10 to-orange-500/5" },
] as const;

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
  const values: Record<string, number> = { cal: calories, pro: proteines, glu: glucides, lip: lipides };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {ITEMS.map((item) => (
        <div
          key={item.key}
          className={`animate-scale-in group relative overflow-hidden rounded-xl border ${item.bg} p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.label}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums leading-none">
                  {values[item.key]}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {item.unit}
                </span>
              </div>
            </div>
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${item.ring} ${item.bg}`}>
              <item.icon className={`size-4 ${item.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
