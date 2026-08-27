"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Loader2, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from "@/shared/components/logo";
import { apiClient } from "@/shared/lib/api-client";

const schema = z.object({
  email: z.string().email("أدخل بريدًا إلكترونيًا صحيحًا"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await apiClient("POST", "/auth/forgot-password", values);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
      <CardHeader className="items-center text-center">
        <Logo className="mb-2" />
        <CardTitle className="text-xl">نسيت كلمة السر</CardTitle>
        <CardDescription>أدخل بريدك الإلكتروني وسنرسل لك رابط تغيير كلمة المرور</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="size-7 text-primary" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              إذا كان البريد الإلكتروني مسجلًا لدينا، فقد تم إرسال رابط تغيير كلمة المرور إليك.
              <br />
              تحقق من بريدك (ومجلد الرسائل غير المرغوبة أيضًا).
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowRight />
                رجوع للدخول
              </Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                إرسال الرابط
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  رجوع لتسجيل الدخول
                </Link>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
