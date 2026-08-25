"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Check, RefreshCcw, Sparkles } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { OFFRES, type SubscriptionTier } from "@/shared/lib/domain";
import { useRenewSubscription } from "@/features/subscriptions/hooks/useSubscriptions";

const schema = z
  .object({
    date_debut: z.string().optional(),
    date_fin: z.string().optional(),
    montant: z.coerce.number().min(0, "المبلغ مطلوب"),
  })
  .superRefine((v, ctx) => {
    if (v.date_debut && v.date_fin && new Date(v.date_fin) <= new Date(v.date_debut)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تاريخ النهاية يجب أن يكون بعد البداية",
        path: ["date_fin"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inMonthISO(): string {
  return new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
}

function inWeekISO(): string {
  return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
}

export function RenewDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [trial, setTrial] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier>("BASIC");
  const renew = useRenewSubscription(userId);

  const offre = OFFRES.find((o) => o.tier === tier)!;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date_debut: "", date_fin: "", montant: offre.prix },
  });

  const pickTier = (t: SubscriptionTier) => {
    setTier(t);
    const o = OFFRES.find((x) => x.tier === t)!;
    form.setValue("montant", o.prix);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await renew.mutateAsync({
        date_debut: values.date_debut || todayISO(),
        date_fin: values.date_fin || (trial ? inWeekISO() : inMonthISO()),
        montant: values.montant,
        essai: trial,
        tier,
      });
      toast.success(trial ? "تم تفعيل فترة التجربة — 7 أيام مجانية" : "تم تجديد الاشتراك — دفعة نقداً مسجّلة");
      setOpen(false);
      setTrial(false);
      form.reset({ date_debut: "", date_fin: "", montant: OFFRES[0].prix });
    } catch {
      toast.error("تعذر نجدّد الاشتراك — حاول مرة أخرى");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <RefreshCcw />
          تجديد الاشتراك
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تجديد اشتراك {userName}</DialogTitle>
          <DialogDescription>
            الدفع يتم نقداً خارج التطبيق — هنا فقط تم تسجيل العرض والمدة والمبلغ.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {OFFRES.map((o) => (
                <button
                  key={o.tier}
                  type="button"
                  onClick={() => pickTier(o.tier)}
                  className={cn(
                    "relative rounded-xl border p-3 text-right transition-colors",
                    tier === o.tier
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/40",
                  )}
                >
                  {tier === o.tier ? (
                    <Check className="absolute left-2 top-2 size-4 text-primary" />
                  ) : null}
                  <div className="text-sm font-bold">{o.nom}</div>
                  <div className="text-lg font-extrabold">{o.prix} د.ت</div>
                  <ul className="mt-1 space-y-0.5 text-[11px] leading-tight text-muted-foreground">
                    {o.features.slice(1).map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" />
                <div>
                  <div className="font-semibold">فترة تجريبية مجانية</div>
                  <div className="text-xs text-muted-foreground">
                    7 أيام مجانية — تاريخ النهاية = اليوم + 7 أيام
                  </div>
                </div>
              </div>
              <Switch checked={trial} onCheckedChange={setTrial} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البداية</FormLabel>
                    <FormControl>
                      <Input type="date" dir="ltr" disabled={trial} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ النهاية</FormLabel>
                    <FormControl>
                      <Input type="date" dir="ltr" disabled={trial} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="montant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ المدفوع (د.ت)</FormLabel>
                  <FormControl>
                    <Input type="number" dir="ltr" min={0} disabled={trial} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={renew.isPending}>
                {trial ? "تفعيل فترة التجربة" : `تسجيل الدفع والتجديد (${offre.nom})`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
