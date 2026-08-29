"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (online) return null;

  return (
    <div className="no-print flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-amber-950">
      <WifiOff className="size-3.5" />
      أنت غير متصل بالإنترنت — الخطة محفوظة وستتم المزامنة تلقائيًّا عند عودة الاتصال
    </div>
  );
}