"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Download, MonitorSmartphone, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noopSubscribe = () => () => {};

export function InstallAppCard() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const installed = useSyncExternalStore(
    noopSubscribe,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isIos =
    mounted &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="size-4 text-primary" />
          نزّل التطبيق
        </CardTitle>
        <CardDescription>
          بدون متجر — ثبّت Coach Yosri على جهازك وافتحه مباشرة كتطبيق، حتى بدون إنترنت
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {installed ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            التطبيق مركّب على جهازك — استمتع!
          </div>
        ) : promptEvent ? (
          <Button
            className="w-full"
            onClick={async () => {
              await promptEvent.prompt();
              const choice = await promptEvent.userChoice;
              if (choice.outcome === "accepted") setPromptEvent(null);
            }}
          >
            <Download />
            تركيب التطبيق الآن
          </Button>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MonitorSmartphone className="size-4 shrink-0" />
              {isIos ? (
                <span>
                  افتح <b>Safari</b> ← زر <b>مشاركة</b> ← «إضافة إلى الشاشة الرئيسية»
                </span>
              ) : (
                <span>
                  افتح القائمة <b>⋮</b> في المتصفح ← «تثبيت التطبيق» أو «إضافة إلى الشاشة
                  الرئيسية»
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              بعد التثبيت: اضغط مطولًا على أيقونة Coach Yosri للوصول بسرعة إلى «تسجيل الوزن»
              و«خطة اليوم».
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}