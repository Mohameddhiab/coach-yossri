"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2, KeyRound, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from "@/shared/components/logo";
import { apiClient } from "@/shared/lib/api-client";

const schema = z
  .object({
    password: z.string().min(12, "كلمة المرور قصيرة (12 حرفًا على الأقل)"),
    confirm: z.string().min(1, "يُرجى تأكيد كلمة المرور"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "كلمتا المرور غير متطابقتين",
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  if (!token) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="items-center text-center">
          <Logo className="mb-2" />
          <CardTitle className="text-xl">رابط غير صحيح</CardTitle>
          <CardDescription>الرابط غير مكتمل — يُرجى إعادة طلب تغيير كلمة المرور</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">طلب رابط جديد</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      await apiClient("POST", "/auth/reset-password", {
        token,
        newPassword: values.password,
      });
      setDone(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ — يُرجى المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
      <CardHeader className="items-center text-center">
        <Logo className="mb-2" />
        <CardTitle className="text-xl">كلمة مرور جديدة</CardTitle>
        <CardDescription>أدخل كلمة المرور الجديدة وأكّدها</CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <p className="text-sm font-semibold">
              تم تغيير كلمة المرور بنجاح 💪
            </p>
            <p className="text-sm text-muted-foreground">جارٍ تحويلك إلى صفحة تسجيل الدخول…</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" dir="ltr" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
                تغيير كلمة المرور
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <LogIn className="size-3.5" />
                <Link href="/login" className="font-semibold transition-colors hover:text-primary">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
