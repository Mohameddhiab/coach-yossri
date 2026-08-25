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
  { href: "/pointage", label: "الحضور", icon: ScanLine },
  { href: "/messages", label: "الرسائل", icon: MessagesSquare },
  { href: "/notifications", label: "الإشعارات", icon: BellRing },
  { href: "/classification", label: "التصنيف", icon: Trophy },
  { href: "/users/new", label: "أضف عضو", icon: UserPlus, exact: true },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ms-auto flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
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
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {COACH_NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {item.href === "/messages" && <NavBadge count={unread} />}
              {item.href === "/notifications" && <NavBadge count={alertsCount} />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <UserAvatar prenom={user?.prenom ?? ""} nom={user?.nom ?? ""} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold">
              {user ? `${user.prenom} ${user.nom}` : "…"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="الخروج"
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
  return match?.label ?? "";
}

export function CoachShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="no-print flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="افتح القائمة" className="fixed end-3 top-3 z-50 lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col" onClick={() => setOpen(false)}>
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <div className="truncate text-sm font-semibold text-muted-foreground">
            {currentSection(pathname)}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
