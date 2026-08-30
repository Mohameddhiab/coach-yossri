"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/lib/api-client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser, useUsers } from "@/features/users/hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";
import { OFFRES, type SubscriptionTier } from "@/shared/lib/domain";

const schema = z
  .object({
    prenom: z.string().min(1, "الاسم الأول غير صحيح"),
    nom: z.string().min(1, "اسم العائلة غير صحيح"),
    email: z.string().email("البريد الإلكتروني غير صحيح"),
    telephone: z
      .string()
      .regex(/^[\d+\s]{8,}$/, "يجب أن يتكون رقم الهاتف من ٨ أرقام على الأقل"),
    tier: z.string().optional(),
    date_debut: z.string().optional(),
    date_fin: z.string().optional(),
    montant: z.coerce.number().min(1, "يجب أن يكون المبلغ أكبر من صفر").optional(),
    referred_by: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (Boolean(v.date_debut) !== Boolean(v.date_fin)) {
      ctx.addIssue({
        code: "custom",
        message: "يُرجى إدخال تاريخي البداية والنهاية معًا أو تركهما فارغين",
        path: ["date_fin"],
      });
    }
    if (v.date_debut && v.date_fin && new Date(v.date_fin) <= new Date(v.date_debut)) {
      ctx.addIssue({
        code: "custom",
        message: "يجب أن يكون تاريخ النهاية بعد تاريخ البداية",
        path: ["date_fin"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function CreateUserForm({ onDone }: { onDone?: () => void }) {
  const createUser = useCreateUser();
  const queryClient = useQueryClient();
  const [generated, setGenerated] = useState<string | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const { data: members } = useUsers("", "TOUS");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      tier: "ONLINE",
      date_debut: "",
      date_fin: "",
      montant: 60,
    },
  });

  const pickedTier = form.watch("tier") as SubscriptionTier | undefined;

  const pickTier = (t: SubscriptionTier) => {
    form.setValue("tier", t);
    const o = OFFRES.find((x) => x.tier === t) ?? OFFRES[0];
    if (o) form.setValue("montant", o.prix);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await createUser.mutateAsync({
        prenom: values.prenom.trim(),
        nom: values.nom.trim(),
        email: values.email.trim().toLowerCase(),
        telephone: values.telephone.trim(),
        referred_by:
          values.referred_by && values.referred_by !== "none" ? values.referred_by : null,
        tier: values.tier,
        date_debut: !values.date_debut ? undefined : values.date_debut,
        date_fin: !values.date_fin ? undefined : values.date_fin,
        montant: values.montant,
        date_naissance: null,
      });
      if (!res?.password || !res?.user?.id) {
        throw new Error("الخادم لم يرجع كلمة المرور — تحقق من الاتصال وحاول مرة أخرى");
      }
      setCreatedUserId(res.user.id);
      setGenerated(res.password);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("تم إنشاء الحساب بنجاح — كلمة المرور بالأسفل");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.code === "EMAIL_TAKEN"
            ? "هذا البريد موجود مسبقاً — استخدم بريداً آخر"
            : err.message
          : err instanceof Error
            ? err.message
            : "تعذّر إنشاء الحساب — يُرجى التحقق من المعلومات والمحاولة مرة أخرى";
      toast.error(msg);
    }
  };

  if (generated && createdUserId) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-sm text-muted-foreground">
          تم إنشاء الحساب. هذه هي كلمة المرور المُنشأة — يُرجى تسليمها للمشترك (تظهر مرة واحدة فقط):
        </div>
        <div className="text-xs text-muted-foreground">
          تم إرسال رابط تأكيد البريد الإلكتروني إلى المشترك (صالح لمدة ٢٤ ساعة).
        </div>
        <div className="mx-auto flex max-w-sm items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3">
          <code dir="ltr" className="flex-1 text-lg font-bold tracking-wider text-primary">
            {generated}
          </code>
          <Button
            size="sm"
            variant="ghost"
            aria-label="نسخ كلمة المرور"
            onClick={() => {
              navigator.clipboard.writeText(generated);
              toast.success("تم النسخ");
            }}
          >
            <Copy />
          </Button>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/users/${createdUserId}`}>الانتقال إلى ملف المشترك</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setGenerated(null);
              setCreatedUserId(null);
              form.reset();
              onDone?.();
            }}
          >
            إضافة مشترك آخر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الأول</FormLabel>
                <FormControl>
                  <Input placeholder="يوسف" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم العائلة</FormLabel>
                <FormControl>
                  <Input placeholder="الجبالي" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input type="email" dir="ltr" placeholder="youssef@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الهاتف</FormLabel>
              <FormControl>
                <Input dir="ltr" placeholder="22 111 222" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="rounded-xl border border-dashed p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">الإحالة (اختياري)</span>
          </div>
          <FormField
            control={form.control}
            name="referred_by"
            render={({ field }) => (
              <FormItem>
                <Select value={field.value || "none"} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="تمت الإحالة بواسطة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">بدون إحالة — مشترك جديد</SelectItem>
                    {members?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.prenom} {m.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="rounded-xl border border-dashed p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">الباقة</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {OFFRES.map((o) => (
              <button
                key={o.tier}
                type="button"
                onClick={() => pickTier(o.tier)}
                className={cn(
                  "relative rounded-xl border p-3 text-right transition-colors",
                  pickedTier === o.tier
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/40",
                )}
              >
                {pickedTier === o.tier ? (
                  <Check className="absolute left-2 top-2 size-4 text-primary" />
                ) : null}
                <div className="text-sm font-bold">{o.nom}</div>
                <div className="text-lg font-extrabold">{o.prix} د.ت</div>
                <ul className="mt-1 space-y-0.5 text-xs leading-tight text-muted-foreground">
                  {o.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-dashed p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">اشتراك أولي (اختياري)</span>
            <Badge variant="outline" className="text-xs">
              نقدًا — خارج التطبيق
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="date_debut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">تاريخ البداية</FormLabel>
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
                  <FormLabel className="text-xs">تاريخ النهاية</FormLabel>
                  <FormControl>
                    <Input type="date" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="montant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">المبلغ (د.ت)</FormLabel>
                  <FormControl>
                    <Input type="number" dir="ltr" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" disabled={createUser.isPending} className="w-full">
          {createUser.isPending && <Loader2 className="animate-spin" />}
          إنشاء الحساب
        </Button>
      </form>
    </Form>
  );
}