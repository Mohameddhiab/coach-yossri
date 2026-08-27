"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { formatDate } from "@/lib/utils";
import {
  useCreateFollowUp,
  useDeleteFollowUp,
  useUserFollowUps,
} from "@/features/follow-ups/hooks/useFollowUps";

export function FollowUpCoachCard({ userId }: { userId: string }) {
  const { data: rows, isLoading } = useUserFollowUps(userId);
  const create = useCreateFollowUp(userId);
  const remove = useDeleteFollowUp();
  const [open, setOpen] = useState(false);
  const [periode, setPeriode] = useState("");
  const [bilan, setBilan] = useState("");
  const [ajustements, setAjustements] = useState("");

  const handleSubmit = async () => {
    if (!periode.trim() || !bilan.trim()) {
      toast.error("الفترة والتقييم مطلوبان");
      return;
    }
    try {
      await create.mutateAsync({
        periode: periode.trim(),
        bilan: bilan.trim(),
        ajustements: ajustements.trim() || null,
      });
      toast.success("تم تسجيل التقييم ✓");
      setPeriode("");
      setBilan("");
      setAjustements("");
      setOpen(false);
    } catch {
      toast.error("تعذر تسجيل التقييم");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("تم الحذف");
    } catch {
      toast.error("تعذر الحذف — حاول مرة أخرى");
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            المتابعة الشخصية
          </CardTitle>
          <CardDescription>تقييماتك و تعديلات البرنامج لهذا العضو</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus /> أضف تقييمًا
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تقييم متابعة جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>الفترة</Label>
                <Input
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  placeholder="الأسبوع 1 — جانفي"
                />
              </div>
              <div className="space-y-1.5">
                <Label>التقييم</Label>
                <Textarea
                  value={bilan}
                  onChange={(e) => setBilan(e.target.value)}
                  rows={4}
                  placeholder="التزام ممتاز، نقص 1.2 كغ هذا الشهر…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>تعديلات البرنامج (اختياري)</Label>
                <Textarea
                  value={ajustements}
                  onChange={(e) => setAjustements(e.target.value)}
                  rows={3}
                  placeholder="تقليل الكارب، إضافة كارديو…"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubmit} disabled={create.isPending}>
                  {create.isPending && <Loader2 className="size-4 animate-spin" />}
                  سجّل
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : !rows?.length ? (
          <EmptyState title="لا يوجد تقييمات حاليًا" description="سجّل أول تقييم للعضو." />
        ) : (
          <div className="space-y-3">
            {[...rows]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((f) => (
                <div key={f.id} className="rounded-xl border border-border p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{f.periode}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="حذف"
                        onClick={() => handleDelete(f.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
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
