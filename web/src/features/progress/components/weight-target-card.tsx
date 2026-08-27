"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crosshair, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeightLog } from "@/shared/lib/domain";
import { estimateTargetDate, targetProgress } from "@/shared/lib/insights";
import { useDeleteWeightTarget, useSetWeightTarget, useWeightTarget } from "@/features/progress/hooks/useWeightTarget";
import { formatDate } from "@/lib/utils";

export function WeightTargetCard({
  userId,
  logs,
  canEdit = false,
}: {
  userId: string;
  logs: WeightLog[] | undefined;
  canEdit?: boolean;
}) {
  const { data: target, isLoading } = useWeightTarget(userId);
  const setTarget = useSetWeightTarget(userId);
  const deleteTarget = useDeleteWeightTarget(userId);
  const [open, setOpen] = useState(false);
  const [poids, setPoids] = useState("");
  const [date, setDate] = useState("");

  const progress = targetProgress(logs ?? [], target ?? null);
  const eta = target ? estimateTargetDate(logs ?? [], target.poids_kg) : null;

  const openDialog = () => {
    if (target) {
      setPoids(String(target.poids_kg));
      setDate(target.date.slice(0, 10));
    } else {
      const last = logs?.[0]?.poids_kg;
      setPoids(last ? String(Math.round((last - 2) * 10) / 10) : "75");
      setDate(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
    }
    setOpen(true);
  };

  const save = async () => {
    const p = Number(poids);
    if (!p || p <= 0 || !date) {
      toast.error("أدخل وزن وتاريخ صحيحين");
      return;
    }
    try {
      await setTarget.mutateAsync({ poids_kg: p, date });
      toast.success("تم تسجيل هدف الوزن");
      setOpen(false);
    } catch {
      toast.error("تعذر حفظ الهدف — حاول مرة أخرى");
    }
  };

  const clear = async () => {
    try {
      await deleteTarget.mutateAsync();
      toast.success("تسمح الهدف");
      setOpen(false);
    } catch {
      toast.error("تعذر نحذف الهدف — حاول مرة أخرى");
    }
  };

  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="size-4 text-primary" />
            هدف الوزن
          </CardTitle>
          {target && (
            <CardDescription>
              وزنك الهدف {target.poids_kg} كغ قبل {formatDate(target.date)}
            </CardDescription>
          )}
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={openDialog}>
            <Pencil />
            {target ? "تعديل" : "تحديد"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? null : !target ? (
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "حدّد هدفك مع المدرب — وزن هدف وتاريخ حتى توصلو."
              : "ما حدّدش المدرب هدف بعد."}
          </p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="relative size-32 shrink-0">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c - (c * progress) / 100}
                  className="stroke-primary transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold tabular-nums">{progress}%</span>
                <span className="text-xs text-muted-foreground">المسار</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">الآن</span>
                <span className="font-bold tabular-nums">{logs?.[0]?.poids_kg ?? "—"} كغ</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">الهدف</span>
                <span className="font-bold tabular-nums text-primary">{target.poids_kg} كغ</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">باقي</span>
                <span className="font-semibold tabular-nums">
                  {logs?.[0]
                    ? `${Math.round((logs[0].poids_kg - target.poids_kg) * 10) / 10} كغ`
                    : "—"}
                </span>
              </div>
              {eta && (
                <div className="max-w-52 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary">
                  على هذا الإقاع توصل لهدفك يوم {formatDate(eta.date)}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target ? "تعديل هدف الوزن" : "تحديد هدف الوزن"}</DialogTitle>
            <DialogDescription>
              المدرب والمشترك يتابعو المسار لهذا الهدف.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>وزن الهدف (كغ)</Label>
              <Input
                type="number"
                dir="ltr"
                step="0.1"
                min={30}
                max={200}
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الوصول</Label>
              <Input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            {target && (
              <Button variant="ghost" className="me-auto text-destructive" onClick={clear}>
                <Trash2 />
                امسح الهدف
              </Button>
            )}
            <Button onClick={save} disabled={setTarget.isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}