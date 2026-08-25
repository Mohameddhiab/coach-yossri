"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/shared/components/empty-state";
import { useAddNote, useDeleteNote, useNotes } from "@/features/users/hooks/useUsers";
import { apiClient } from "@/shared/lib/api-client";
import { formatDate } from "@/lib/utils";

function applyTemplate(
  template: string,
  vars: { prenom?: string; jours?: number },
): string {
  return template
    .replaceAll("{prenom}", vars.prenom ?? "العضو")
    .replaceAll("{jours}", String(vars.jours ?? "؟"));
}

export function NotesPanel({
  userId,
  userName,
  daysLeft,
}: {
  userId: string;
  userName?: string;
  daysLeft?: number;
}) {
  const { data: notes, isLoading } = useNotes(userId);
  const addNote = useAddNote(userId);
  const deleteNote = useDeleteNote(userId);
  const [content, setContent] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["coach-settings"],
    queryFn: () =>
      apiClient<{ message_templates?: string[] }>("GET", "/coach/settings"),
  });
  const templates = settings?.message_templates ?? [];

  const submit = async () => {
    if (!content.trim()) return;
    try {
      await addNote.mutateAsync(content.trim());
      toast.success("زدات الملاحظة");
      setContent("");
    } catch {
      toast.error("تعذر إضافة الملاحظة — حاول مرة أخرى");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ملاحظات خاصة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Zap className="size-3.5 text-amber-500" />
              ردود سريعة — اضغط لإدراجها
            </div>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t, i) => (
                <button
                  key={i}
                  className="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  onClick={() =>
                    setContent(
                      (prev) =>
                        prev +
                        (prev && !prev.endsWith("\n") ? "\n" : "") +
                        applyTemplate(t, { prenom: userName, jours: daysLeft }),
                    )
                  }
                >
                  {t.length > 42 ? t.slice(0, 42) + "…" : t}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Textarea
            placeholder="ملاحظات سرية ما يراهاش العضو..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <Button onClick={submit} disabled={!content.trim() || addNote.isPending} className="w-full sm:w-auto">
            <Plus />
            أضف ملاحظة
          </Button>
        </div>
        {!isLoading && notes && notes.length > 0 && (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group rounded-lg border bg-muted/40 p-3 text-sm"
              >
                <p className="whitespace-pre-wrap">{note.contenu}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="حذف الملاحظة"
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={async () => {
                      try {
                        await deleteNote.mutateAsync(note.id);
                        toast.success("تم الحذفت الملاحظة");
                      } catch {
                        toast.error("تعذر نحذف الملاحظة");
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && notes && notes.length === 0 && (
          <EmptyState title="لا يوجد ملاحظات بعد" />
        )}
      </CardContent>
    </Card>
  );
}