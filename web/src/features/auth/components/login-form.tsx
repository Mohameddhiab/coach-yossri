"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from "@/shared/components/logo";
import { useAuth } from "@/shared/lib/auth-context";

const DEMO_CREDENTIALS = {
  coach: { email: "coach@9awi.tn", password: "coach1234" },
  user: { email: "youssef@demo.tn", password: "123456" },
} as const;

const schema = z.object({
  email: z.string().email("أدخل بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(1, "اكتب كلمة السر"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      router.push(user.role === "COACH" ? "/dashboard" : "/plan");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "صار خطأ أثناء الدخول");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
      <CardHeader className="items-center text-center">
        <Logo className="mb-2" />
        <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
        <CardDescription>أهلاً بك في منصة Coach Yosri 💪</CardDescription>
      </CardHeader>
      <CardContent>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة السر</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        dir="ltr"
                        placeholder="••••••••"
                        className="pe-10"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary transition-colors hover:underline"
              >
                نسيت كلمة السر؟
              </Link>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
              دخول
            </Button>
          </form>
        </Form>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <div className="mb-1.5 font-semibold text-foreground">بيانات تجريبية (سيرفور محلي)</div>
            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => {
                  form.setValue("email", DEMO_CREDENTIALS.coach.email);
                  form.setValue("password", DEMO_CREDENTIALS.coach.password);
                }}
              >
                المدرب: {DEMO_CREDENTIALS.coach.email} / {DEMO_CREDENTIALS.coach.password}
              </button>
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => {
                  form.setValue("email", DEMO_CREDENTIALS.user.email);
                  form.setValue("password", DEMO_CREDENTIALS.user.password);
                }}
              >
                عضو: {DEMO_CREDENTIALS.user.email} / {DEMO_CREDENTIALS.user.password}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}