"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, MessageCircle, Paperclip, SendHorizonal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/lib/auth-context";
import { ErrorState } from "@/shared/components/error-state";
import {
  useMarkRead,
  useMessages,
  useSendMessage,
} from "@/features/chat/hooks/useChat";
import { cn, formatTime } from "@/lib/utils";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_BYTES = 30 * 1024 * 1024;

function isImage(type?: string | null) {
  return !!type && type.startsWith("image/");
}
function isVideo(type?: string | null) {
  return !!type && type.startsWith("video/");
}

export function ChatPanel({
  conversationId,
  title,
  emptyHint,
  onBack,
}: {
  conversationId: string;
  title?: string;
  emptyHint?: string;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMessages(conversationId);
  const send = useSendMessage(conversationId);

  useMarkRead(conversationId, true, messages);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, preview]);

  useEffect(() => {
    if (!file) {
      const id = setTimeout(() => setPreview(null), 0);
      return () => clearTimeout(id);
    }
    const url = URL.createObjectURL(file);
    const id = setTimeout(() => setPreview(url), 0);
    return () => {
      clearTimeout(id);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handlePick = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (![...ALLOWED_IMAGE, ...ALLOWED_VIDEO].includes(f.type)) {
      toast.error("نوع الملف غير مدعوم — الصور والفيديو فقط");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("الملف كبير جداً (الحد 30 ميغابايت)");
      e.target.value = "";
      return;
    }
    setFile(f);
    e.target.value = "";
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSend = async () => {
    const contenu = text.trim();
    if (!contenu && !file) return;
    setText("");
    const f = file;
    setFile(null);
    setPreview(null);
    try {
      await send.mutateAsync({ contenu, file: f });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذّر إرسال الرسالة — يُرجى المحاولة مرة أخرى";
      // Afficher le vrai code backend (ex: Type non autorisé, Fichier trop volumineux, SUBSCRIPTION_EXPIRED)
      toast.error(msg);
      setText(contenu);
      if (f) setFile(f);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border">
      {title ? (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-semibold">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 lg:hidden"
              aria-label="الرجوع إلى القائمة"
              onClick={onBack}
            >
              <ArrowRight className="size-4" />
            </Button>
          )}
          <span className="truncate">{title}</span>
        </div>
      ) : null}

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4" dir="auto">
        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="ms-auto h-10 w-2/3 rounded-xl" />
            <Skeleton className="h-10 w-1/2 rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
        ) : !messages?.length ? (
           <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle className="size-7" />
              </span>
              <p className="text-sm text-muted-foreground">{emptyHint ?? "ابدأ المحادثة — أرسل أول رسالة الآن 👋"}</p>
              <p className="text-xs text-muted-foreground">يمكنك إرسال صور وجبات أو فيديو للحركة 📷🎥</p>
            </div>
        ) : (
          messages.map((m) => {
            const mine =
              m.sender_id === user?.id ||
              (m.sender_role != null && m.sender_role === (user?.role as string));
            const hasAttachment = !!m.attachment_url;
            const attType = m.attachment_type;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] break-words rounded-2xl px-3.5 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    hasAttachment ? "overflow-hidden p-1.5" : "whitespace-pre-line",
                  )}
                >
                  {hasAttachment && (
                    <div className="mb-1.5 overflow-hidden rounded-xl bg-black/5">
                      {isImage(attType) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.attachment_url!}
                          alt={m.attachment_name ?? "photo"}
                          loading="lazy"
                          className="max-h-[320px] w-auto max-w-[260px] object-contain"
                        />
                      ) : isVideo(attType) ? (
                        <video
                          src={m.attachment_url!}
                          controls
                          preload="metadata"
                          className="max-h-[320px] w-auto max-w-[260px] rounded-xl"
                        />
                      ) : (
                        <a
                          href={m.attachment_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-3 py-2 text-xs underline"
                        >
                          {m.attachment_name ?? "فتح الملف"}
                        </a>
                      )}
                    </div>
                  )}
                  {m.contenu ? <div className="whitespace-pre-line px-1">{m.contenu}</div> : null}
                  <span
                    className={cn(
                       "mt-1 block w-fit rounded-full bg-black/5 px-1.5 py-0.5 text-xs tabular-nums dark:bg-white/10",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                    dir="ltr"
                  >
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {file && preview && (
        <div className="flex items-center gap-3 border-t bg-muted/30 px-3 py-2">
          <div className="relative shrink-0">
            {file.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <video src={preview} className="h-16 w-16 rounded-lg object-cover" muted />
            )}
            <button
              onClick={clearFile}
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              aria-label="إزالة"
            >
              <X className="size-3" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFile}>إلغاء</Button>
        </div>
      )}

      <form
         className="flex items-center gap-2 border-t border-border bg-background/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={onFileChange}
        />
        <Button type="button" variant="ghost" size="icon" onClick={handlePick} aria-label="إرفاق">
          <Paperclip className="size-4" />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={file ? "أضف تعليقاً (اختياري)…" : "اكتب رسالة…"}
          maxLength={4000}
        />
        <Button type="submit" size="icon" disabled={(!text.trim() && !file) || send.isPending}>
          {send.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
