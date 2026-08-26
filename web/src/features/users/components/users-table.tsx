"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, HeartPulse, Search } from "lucide-react";
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
import { useUsers } from "@/features/users/hooks/useUsers";
import { SubscriptionBadge } from "@/features/subscriptions/components/subscription-badge";
import { UserAvatar } from "@/shared/components/user-avatar";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { getSubscriptionStatus, type SubscriptionStatus } from "@/shared/lib/domain";
import { computeEngagement } from "@/shared/lib/insights";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: SubscriptionStatus | "TOUS"; label: string }[] = [
  { value: "TOUS", label: "الكل" },
  { value: "ACTIF", label: "نشط" },
  { value: "ESSAI", label: "تجريبي" },
  { value: "EXPIRE_BIENTOT", label: "أوشك على الانتهاء" },
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
  const deferredSearch = useDebounced(search, 300);
  const [status, setStatus] = useState<SubscriptionStatus | "TOUS">("TOUS");
  const [byEngagement, setByEngagement] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { data: users, isLoading, isError, refetch, isRefetching } = useUsers(
    deferredSearch,
    status,
  );

  useEffect(() => {
    const timer = setInterval(() => setPlaceholderIndex((index) => (index + 1) % 2), 2600);
    return () => clearInterval(timer);
  }, []);

  const rows = useMemo(
    () =>
      byEngagement
        ? [...(users ?? [])].sort(
            (a, b) => computeEngagement(b).score - computeEngagement(a).score,
          )
        : users,
    [byEngagement, users],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
             placeholder={placeholderIndex === 0 ? "بحث بالاسم..." : "بحث بالبريد الإلكتروني..."}
            aria-label="بحث عن عضو"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Tabs value={status} onValueChange={(v: string) => setStatus(v as SubscriptionStatus | "TOUS")}>
          <TabsList className="flex-wrap">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant={byEngagement ? "default" : "outline"}
          size="sm"
          onClick={() => setByEngagement((v) => !v)}
          title="رتب الأعضاء حسب التزامهم"
        >
          <HeartPulse className="size-4" />
          الالتزام
        </Button>
        {!isLoading && !isError && (
          <span className="ms-auto text-xs text-muted-foreground tabular-nums">
            {rows?.length ?? 0} عضو
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : !users || users.length === 0 ? (
        <EmptyState
          title={search ? "لا يوجد نتائج للبحث" : "لا يوجد أعضاء"}
          description={
            search ? "جرّب كلمات بحث أخرى" : "ابدأ بزيادة أول عضو من زر «أضف عضو»"
          }
          action={
            !search ? (
              <Button asChild>
                <Link href="/users/new">أضف أول عضو</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>العضو</TableHead>
                <TableHead className="hidden md:table-cell">الهاتف</TableHead>
                <TableHead>الاشتراك</TableHead>
                <TableHead className="hidden lg:table-cell">آخر وزن</TableHead>
                <TableHead className="hidden lg:table-cell">الخطة</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows?.map((user) => {
                const statusValue = getSubscriptionStatus(user.subscription);
                const engagement = computeEngagement(user);
                const stale =
                  user.days_since_last_weight === null || user.days_since_last_weight >= 14;
                return (
                    <TableRow
                    key={user.id}
                     className="cursor-pointer transition-colors hover:bg-primary/5"
                    tabIndex={0}
                    onClick={() => router.push(`/users/${user.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/users/${user.id}`);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <UserAvatar
                           prenom={user.prenom}
                           nom={user.nom}
                           className={cn(
                             "ring-2 ring-offset-2 ring-offset-card",
                             statusValue === "ACTIF" && "ring-emerald-500/70",
                             statusValue === "ESSAI" && "ring-sky-500/70",
                             statusValue === "EXPIRE_BIENTOT" && "ring-amber-500/70",
                             statusValue === "EXPIRE" && "ring-destructive/70",
                           )}
                         />
                        <div className="leading-tight">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <span
                              title={`الالتزام: ${engagement.score}/100 — ${engagement.label}`}
                              className={cn("size-2 rounded-full", ENGAGEMENT_DOT[engagement.color])}
                            />
                            <span className="max-w-36 truncate">{user.prenom} {user.nom}</span>
                            <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                              {engagement.score}
                            </span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground" dir="ltr">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell" dir="ltr">
                      {user.telephone}
                    </TableCell>
                    <TableCell>
                      <SubscriptionBadge status={statusValue} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.last_weight ? (
                        <div className="leading-tight">
                          <div className="tabular-nums font-medium">
                            {user.last_weight.poids_kg} كغ
                          </div>
                          <div
                            className={
                              stale
                                ? "text-xs text-destructive"
                                : "text-xs text-muted-foreground"
                            }
                          >
                            {user.days_since_last_weight === 0
                              ? "اليوم"
                              : `منذ ${user.days_since_last_weight} يوم`}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-destructive">
                          ما زال ما سجّل وزن
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.plan_version ? (
                        <Badge variant="secondary">الإصدار {user.plan_version}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronLeft className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          <div className="space-y-2 sm:hidden">
            {rows?.map((user) => {
              const statusValue = getSubscriptionStatus(user.subscription);
              const engagement = computeEngagement(user);
              const stale =
                user.days_since_last_weight === null || user.days_since_last_weight >= 14;
              return (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                   className={cn(
                     "flex items-center gap-3 rounded-xl border border-r-4 bg-card p-3 shadow-sm transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-primary/5 hover:shadow-md",
                     statusValue === "ACTIF" && "border-r-emerald-500",
                     statusValue === "ESSAI" && "border-r-sky-500",
                     statusValue === "EXPIRE_BIENTOT" && "border-r-amber-500",
                     statusValue === "EXPIRE" && "border-r-destructive",
                   )}
                >
                   <UserAvatar
                     prenom={user.prenom}
                     nom={user.nom}
                     className={cn(
                       "ring-2 ring-offset-2 ring-offset-card",
                       statusValue === "ACTIF" && "ring-emerald-500/70",
                       statusValue === "ESSAI" && "ring-sky-500/70",
                       statusValue === "EXPIRE_BIENTOT" && "ring-amber-500/70",
                       statusValue === "EXPIRE" && "ring-destructive/70",
                     )}
                   />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span
                        title={`الالتزام: ${engagement.score}/100 — ${engagement.label}`}
                        className={cn("size-2 shrink-0 rounded-full", ENGAGEMENT_DOT[engagement.color])}
                      />
                      <span className="truncate">
                        {user.prenom} {user.nom}
                      </span>
                      <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                        {engagement.score}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <SubscriptionBadge status={statusValue} />
                      {user.last_weight ? (
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            stale ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {user.last_weight.poids_kg} كغ ·{" "}
                          {user.days_since_last_weight === 0
                            ? "اليوم"
                            : `منذ ${user.days_since_last_weight} يوم`}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive">لم يسجل وزنه بعد</span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
