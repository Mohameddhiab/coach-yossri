"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BellRing,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  ScanLine,
  Settings,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/shared/components/logo";
import { UserAvatar } from "@/shared/components/user-avatar";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { OfflineBanner } from "@/shared/components/offline-banner";
import { useAuth } from "@/shared/lib/auth-context";
import { computeAlerts } from "@/shared/lib/insights";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useConversations } from "@/features/chat/hooks/useChat";
import { cn } from "@/lib/utils";

export const COACH_NAV: {
  href: string;
  label: string;
  icon: typeof Users;
  exact?: boolean;
}[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/users", label: "الأعضاء", icon: Users },
  { href: "/pointage", label: "تسجيل الحضور", icon: ScanLine },
  { href: "/messages", label: "الرسائل", icon: MessagesSquare },
  { href: "/notifications", label: "الإشعارات", icon: BellRing },
  { href: "/classification", label: "التصنيف والترتيب", icon: Trophy },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavBadge({ count, variant = "danger" }: { count: number; variant?: "danger" | "amber" }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ms-auto flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-black leading-none tabular-nums shadow-sm",
        variant === "danger"
          ? "bg-destructive text-white animate-pulse"
          : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: users } = useUsers("", "TOUS");
  const alertsCount = users ? computeAlerts(users).length : 0;

  const { data: conversations } = useConversations(30000);
  const unread = (conversations ?? []).reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
        <Logo />
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary ring-1 ring-primary/20">
          Coach Pro
        </span>
      </div>

      {/* Quick Action */}
      <div className="p-3">
        <Button
          asChild
          className="w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-white shadow-lg shadow-amber-500/20 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/30"
        >
          <Link href="/users/new">
            <UserPlus className="size-4" />
            أضف عضو جديد
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="القائمة الرئيسية">
        {COACH_NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                active
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-4.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === "/messages" && <NavBadge count={unread} variant="danger" />}
              {item.href === "/notifications" && <NavBadge count={alertsCount} variant="amber" />}
            </Link>
          );
        })}
      </nav>

      {/* Coach Profile Card Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5 ring-1 ring-border/40">
          <div className="relative">
            <UserAvatar
              prenom={user?.prenom ?? "كابتن"}
              nom={user?.nom ?? "يسري"}
              className="size-10 ring-2 ring-primary/30"
            />
            <span
              className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-background"
              title="متصل الآن"
            />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold text-foreground">
              {user ? `${user.prenom} ${user.nom}` : "كابتن يسري"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            onClick={async () => {
              await logout();
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function currentSection(pathname: string): string {
  const match = [...COACH_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href, item.exact));
  return match?.label ?? "لوحة التحكم";
}

export function CoachShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const todayFormatted = new Intl.DateTimeFormat("ar-TN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="no-print flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="افتح القائمة"
            className="fixed end-4 top-3.5 z-50 size-10 rounded-xl shadow-md lg:hidden"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-4rem)] flex-col" onClick={() => setOpen(false)}>
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />

        {/* Global Web Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-foreground">
                  {currentSection(pathname)}
                </span>
              </div>
              <div className="hidden text-xs text-muted-foreground sm:block">
                {todayFormatted}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden gap-1.5 rounded-xl sm:inline-flex"
            >
              <Link href="/pointage">
                <ScanLine className="size-4 text-primary" />
                <span>حضور سريع</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
