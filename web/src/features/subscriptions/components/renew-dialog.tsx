"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Check, RefreshCcw } from "lucide-react";
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
        message: "يجب أن يكون تاريخ النهاية بعد تاريخ البداية",
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

export function RenewDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier>("ONLINE");
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
        date_fin: values.date_fin || inMonthISO(),
        montant: values.montant,
        tier,
      });
      toast.success("تم تجديد الاشتراك بنجاح — تم تسجيل الدفعة نقدًا");
      setOpen(false);
      form.reset({ date_debut: "", date_fin: "", montant: OFFRES[0].prix });
    } catch {
      toast.error("تعذّر تجديد الاشتراك — يُرجى المحاولة مرة أخرى");
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
            يتم الدفع نقدًا خارج التطبيق — يُسجّل هنا فقط نوع الباقة والمدة والمبلغ المستلم.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
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
                  <ul className="mt-1 space-y-0.5 text-xs leading-tight text-muted-foreground">
                    {o.features.slice(1).map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البداية</FormLabel>
                    <FormControl>
                      <Input type="date" dir="ltr" {...field} />
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
                      <Input type="date" dir="ltr" {...field} />
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
                    <Input type="number" dir="ltr" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={renew.isPending}>
                {`تسجيل الدفع والتجديد (${offre.nom})`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
