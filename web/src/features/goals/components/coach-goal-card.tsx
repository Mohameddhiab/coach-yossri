"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Flame, Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGoal, useSetGoal } from "@/features/goals/hooks/useGoals";
import { currentStreak } from "@/features/goals/lib/streak";

const schema = z.object({
  titre: z.string().min(1, "عنوان الهدف مطلوب"),
  cible: z.coerce.number().min(1, "عدد الحصص مطلوب").max(60, "رقم غير منطقي"),
});

type FormValues = z.infer<typeof schema>;

export function CoachGoalCard({ userId }: { userId: string }) {
  const { data: goal, isLoading } = useGoal(userId);
  const setGoal = useSetGoal(userId);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titre: "", cible: 8 },
  });

  useEffect(() => {
    if (goal) {
      form.reset({ titre: goal.titre, cible: goal.cible });
    }
  }, [goal, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await setGoal.mutateAsync(values);
      toast.success("تم تسجيل هدف الشهر");
      setOpen(false);
    } catch {
      toast.error("تعذر حفظ الهدف — حاول مرة أخرى");
    }
  };

  if (isLoading) return null;

  const done = goal ? goal.checkins.length : 0;
  const pct = goal ? Math.min(100, Math.round((done / goal.cible) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-primary" />
          <CardTitle className="text-base">هدف الشهر</CardTitle>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              {goal ? <Pencil /> : <Plus />}
              {goal ? "تعديل" : "إنشاء"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>هدف الشهر</DialogTitle>
              <DialogDescription>حافز لزيادة الالتزام — يظهر للعضو في تطبيقه مع زر «حضرت حصة اليوم».</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان الهدف</FormLabel>
                      <FormControl>
                        <Input placeholder="4 حصص تدريب هذا الشهر" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الحصص اللي تريد</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={setGoal.isPending}>
                    {setGoal.isPending && <Loader2 className="animate-spin" />}
                    حفظ
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {goal ? (
          <>
            <CardDescription>{goal.titre}</CardDescription>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {done} / {goal.cible} حصة
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <Flame className="size-3.5" />
                  {currentStreak(goal.checkins)} يوم متتالي
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <CardDescription>لا يوجد هدف لهذا الشهر بعد — أنشئ واحدًا لتحفيز العضو.</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}