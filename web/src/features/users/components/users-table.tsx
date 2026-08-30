"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  HeartPulse,
  MailWarning,
  Phone,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsersPaged } from "@/features/users/hooks/useUsers";
import { SubscriptionBadge } from "@/features/subscriptions/components/subscription-badge";
import { UserAvatar } from "@/shared/components/user-avatar";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import {
  daysLeft,
  getSubscriptionStatus,
  type SubscriptionStatus,
} from "@/shared/lib/domain";
import { computeEngagement } from "@/shared/lib/insights";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const STATUS_TABS: { value: SubscriptionStatus | "TOUS"; label: string }[] = [
  { value: "TOUS", label: "الكل" },
  { value: "ACTIF", label: "نشط" },
  { value: "EXPIRE_BIENTOT", label: "ينتهي قريباً" },
  { value: "EXPIRE", label: "منتهي" },
];

const ENGAGEMENT_DOT: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function UsersTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDebounced(search, 250);
  const [status, setStatus] = useState<SubscriptionStatus | "TOUS">("TOUS");
  const [byEngagement, setByEngagement] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    isFetching,
  } = useUsersPaged(deferredSearch, status, page, PAGE_SIZE);

  useEffect(() => {
    const timer = setInterval(() => setPlaceholderIndex((index) => (index + 1) % 2), 3000);
    return () => clearInterval(timer);
  }, []);

  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (byEngagement) {
      return [...list].sort(
        (a, b) => computeEngagement(b).score - computeEngagement(a).score,
      );
    }
    return list;
  }, [byEngagement, data]);

  const copyPhone = (e: React.MouseEvent, tel: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tel);
    toast.success("تم نسخ رقم الهاتف");
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search + Filters + Sort */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-3 backdrop-blur-sm">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholderIndex === 0 ? "البحث بالاسم أو اسم العائلة…" : "البحث بالبريد أو الهاتف…"}
            aria-label="البحث عن مشترك"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pe-8 ps-9 rounded-xl border-border/80 bg-background/80"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="مسح البحث"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Tabs
          value={status}
          onValueChange={(v: string) => {
            setStatus(v as SubscriptionStatus | "TOUS");
            setPage(1);
          }}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-auto flex-wrap gap-1 rounded-xl bg-muted/70 p-1">
            {STATUS_TABS.map((t) => {
              const count = data?.counts?.[t.value] ?? 0;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <span>{t.label}</span>
                  {data && (
                    <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.2 text-xs tabular-nums">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <Button
          variant={byEngagement ? "default" : "outline"}
          size="sm"
          onClick={() => setByEngagement((v) => !v)}
          className={cn(
            "gap-1.5 rounded-xl font-semibold",
            byEngagement && "bg-primary text-primary-foreground shadow-sm",
          )}
          title="ترتيب المشتركين بحسب درجة التزامهم"
        >
          <HeartPulse className="size-4" />
          <span>ترتيب بحسب الالتزام</span>
        </Button>

        {!isLoading && !isError && (
          <span className="ms-auto hidden text-xs font-medium text-muted-foreground tabular-nums sm:inline-block">
            {total} مشترك إجمالاً
          </span>
        )}
      </div>

      {/* Main Table / State presentation */}
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title={search ? "لا توجد نتائج مطابقة للبحث" : "لا يوجد مشتركون في هذا القسم"}
          description={
            search
              ? "تحقق من صحة الاسم أو رقم الهاتف وجرّب كلمات بحث أخرى"
              : "أضف مشتركًا جديدًا لتبدأ متابعته من هنا"
          }
          action={
            !search ? (
              <Button asChild className="gap-2 font-bold">
                <Link href="/users/new">
                  <UserCheck className="size-4" />
                  إضافة مشترك جديد
                </Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSearch("")}>
                إلغاء البحث
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm sm:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-transparent">
                  <TableHead className="font-bold">المشترك</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">الهاتف</TableHead>
                  <TableHead className="font-bold">الاشتراك</TableHead>
                  <TableHead className="hidden lg:table-cell font-bold">آخر وزن</TableHead>
                  <TableHead className="hidden lg:table-cell font-bold">البرنامج</TableHead>
                  <TableHead className="w-12 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => {
                  const statusValue = getSubscriptionStatus(user.subscription);
                  const remaining = daysLeft(user.subscription);
                  const engagement = computeEngagement(user);
                  const stale =
                    user.days_since_last_weight === null || user.days_since_last_weight >= 14;

                  return (
                    <TableRow
                      key={user.id}
                      tabIndex={0}
                      className="group cursor-pointer transition-colors hover:bg-primary/[0.04] focus-visible:bg-primary/[0.06] focus-visible:outline-none"
                      onClick={() => router.push(`/users/${user.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/users/${user.id}`);
                        }
                      }}
                    >
                      {/* User Info */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <UserAvatar
                              prenom={user.prenom}
                              nom={user.nom}
                              className={cn(
                                "size-10 ring-2 ring-offset-2 ring-offset-card transition-transform group-hover:scale-105",
                                statusValue === "ACTIF" && "ring-emerald-500/70",
                                statusValue === "EXPIRE_BIENTOT" && "ring-amber-500/70",
                                statusValue === "EXPIRE" && "ring-destructive/70",
                              )}
                            />
                            <span
                              title={`درجة الالتزام: ${engagement.score}/100 — ${engagement.label}`}
                              className={cn(
                                "absolute -bottom-0.5 -end-0.5 size-3 rounded-full ring-2 ring-card",
                                ENGAGEMENT_DOT[engagement.color],
                              )}
                            />
                          </div>

                          <div className="min-w-0 leading-tight">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-bold text-foreground group-hover:text-primary transition-colors">
                                {user.prenom} {user.nom}
                              </span>
                              <span
                                className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground tabular-nums"
                                title="مؤشر الالتزام"
                              >
                                {engagement.score}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs text-muted-foreground" dir="ltr">
                                {user.email}
                              </span>
                              {!user.email_verified && (
                                <span
                                  title="بريد غير مؤكد"
                                  className="text-destructive"
                                  aria-label="بريد غير مؤكد"
                                >
                                  <MailWarning className="size-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone Column */}
                      <TableCell className="hidden md:table-cell" dir="ltr">
                        <button
                          type="button"
                          onClick={(e) => copyPhone(e, user.telephone)}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="نسخ رقم الهاتف"
                        >
                          <Phone className="size-3 text-primary/70" />
                          <span>{user.telephone}</span>
                          <Copy className="size-2.5 opacity-0 group-hover:opacity-60" />
                        </button>
                      </TableCell>

                      {/* Subscription Status */}
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SubscriptionBadge status={statusValue} />
                          {remaining > 0 && statusValue === "EXPIRE_BIENTOT" && (
                            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                              متبقٍ {remaining} يومًا
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Last Weight Entry */}
                      <TableCell className="hidden lg:table-cell">
                        {user.last_weight ? (
                          <div className="leading-tight">
                            <div className="font-bold tabular-nums text-foreground">
                              {user.last_weight.poids_kg} كغم
                            </div>
                            <div
                              className={cn(
                                "text-xs tabular-nums",
                                stale ? "font-semibold text-destructive" : "text-muted-foreground",
                              )}
                            >
                              {user.days_since_last_weight === 0
                                ? "اليوم"
                                : `منذ ${user.days_since_last_weight} يومًا`}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-dashed text-destructive">
                            لم يسجّل بعد
                          </Badge>
                        )}
                      </TableCell>

                      {/* Plan Version */}
                      <TableCell className="hidden lg:table-cell">
                        {user.plan_version ? (
                          <Badge variant="secondary" className="gap-1 font-semibold">
                            <Dumbbell className="size-3 text-primary" />
                            <span>الإصدار {user.plan_version}</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Action Chevron */}
                      <TableCell className="text-center">
                        <div className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
                          <ChevronLeft className="size-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile / Tablet Compact Cards View with Logical RTL border */}
          <div className="space-y-3 sm:hidden">
            {rows.map((user) => {
              const statusValue = getSubscriptionStatus(user.subscription);
              const engagement = computeEngagement(user);
              const stale =
                user.days_since_last_weight === null || user.days_since_last_weight >= 14;

              return (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl border border-s-4 bg-card p-4 shadow-sm transition-all hover:bg-primary/[0.04] active:scale-[0.99]",
                    statusValue === "ACTIF" && "border-s-emerald-500",
                    statusValue === "EXPIRE_BIENTOT" && "border-s-amber-500",
                    statusValue === "EXPIRE" && "border-s-destructive",
                  )}
                >
                  <UserAvatar
                    prenom={user.prenom}
                    nom={user.nom}
                    className={cn(
                      "size-11 ring-2 ring-offset-2 ring-offset-card",
                      statusValue === "ACTIF" && "ring-emerald-500/70",
                      statusValue === "EXPIRE_BIENTOT" && "ring-amber-500/70",
                      statusValue === "EXPIRE" && "ring-destructive/70",
                    )}
                  />

                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span
                        className={cn("size-2 shrink-0 rounded-full", ENGAGEMENT_DOT[engagement.color])}
                      />
                      <span className="truncate">
                        {user.prenom} {user.nom}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        {engagement.score}%
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SubscriptionBadge status={statusValue} />
                      {user.last_weight ? (
                        <span
                          className={cn(
                            "text-xs tabular-nums font-medium",
                            stale ? "text-destructive font-bold" : "text-muted-foreground",
                          )}
                        >
                          {user.last_weight.poids_kg} كغم ·{" "}
                          {user.days_since_last_weight === 0
                            ? "اليوم"
                            : `منذ ${user.days_since_last_weight} يومًا`}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive">لم يسجّل الوزن بعد</span>
                      )}
                    </div>
                  </div>

                  <ChevronLeft className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                الصفحة {page} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-xl font-semibold"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-xl font-semibold"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  التالي
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
