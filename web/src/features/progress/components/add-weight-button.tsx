"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CloudOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAddWeight } from "@/features/progress/hooks/useProgress";
import { toast } from "sonner";

const schema = z.object({
  poids_kg: z.coerce
    .number({ message: "أدخل الوزن" })
    .min(20, "قيمة مش منطقية")
    .max(300, "قيمة مش منطقية"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const QUEUE_KEY = "9awi_pending_weights";

interface PendingWeight {
  userId: string;
  poids_kg: number;
  note?: string;
}

function readQueue(): PendingWeight[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingWeight[]) : [];
  } catch {
    return [];
  }
}

export function AddWeightButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const addWeight = useAddWeight(userId);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { poids_kg: undefined, note: "" },
  });

  useEffect(() => {
    const flush = async () => {
      const queue = readQueue();
      if (queue.length === 0) return;
      for (const item of queue) {
        try {
          await addWeight.mutateAsync({
            poids_kg: item.poids_kg,
            note: item.note?.trim() ? item.note.trim() : undefined,
          });
        } catch {
          return;
        }
      }
      localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
      toast.success(`تزامن ${queue.length} قياس كان محفوظ`);
    };
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [addWeight]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      poids_kg: values.poids_kg,
      note: values.note?.trim() ? values.note.trim() : undefined,
    };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const queue = readQueue();
      queue.push({ userId, ...payload });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      toast.success("أنت مش متصل — تم تسجيل الوزن وبيتزامن أوتوماتيكياً لما ترجع الاتصال");
      setOpen(false);
      form.reset();
      return;
    }
    try {
      await addWeight.mutateAsync(payload);
      setOpen(false);
      form.reset();
    } catch {
      toast.error("تعذر نسجل الوزن — حاول مرة أخرى");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          تسجيل وزن
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل وزن جديد</DialogTitle>
          <DialogDescription>أدخل وزن اليوم — كل أسبوع يحسب تقدم!</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="poids_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوزن (كغ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      dir="ltr"
                      placeholder="75.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظة (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="شعور جيد، تمرين قوي..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {typeof navigator !== "undefined" && !navigator.onLine && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                <CloudOff className="size-4" />
                لا يوجد اتصال — بيتم حفظ الوزن والمزامنة لاحقاً.
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={addWeight.isPending}>
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}