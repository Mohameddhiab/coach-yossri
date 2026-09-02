"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { TransformationSlider } from "@/features/progress/components/transformation-slider";
import { useAddPhoto, useDeletePhoto, usePhotos } from "@/features/progress/hooks/useProgress";
import { formatDate } from "@/lib/utils";

export function PhotoGallery({ userId, canEdit = true }: { userId: string; canEdit?: boolean }) {
  const { data: photos, isLoading } = usePhotos(userId);
  const addPhoto = useAddPhoto(userId);
  const deletePhoto = useDeletePhoto(userId);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جدًا — يُرجى اختيار صورة أصغر من 3 ميغابايت");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await addPhoto.mutateAsync({ url: dataUrl });
      toast.success("تمت إضافة الصورة بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">صور التقدّم</h3>
        {canEdit && (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="اختر صورة للتقدم"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Camera />}
              إضافة صورة
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : photos && photos.length > 0 ? (
        <div className="space-y-4">
          <TransformationSlider photos={photos} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <figure key={photo.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl border">
                <Image
                  src={photo.url}
                  alt="صورة تقدّم"
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="text-xs text-white">{formatDate(photo.date)}</span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="حذف الصورة"
                      className="text-white hover:bg-white/20"
                      onClick={async () => {
                        try {
                          await deletePhoto.mutateAsync(photo.id);
                          toast.success("تم حذف الصورة بنجاح");
                        } catch {
                          toast.error("تعذّر حذف الصورة — يُرجى المحاولة مرة أخرى");
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="لا توجد صور مسجلة بعد"
          description="أضف صورًا بانتظام (بنفس الزاوية والإضاءة) لمشاهدة تطور جسمك بوضوح"
        />
      )}
    </div>
  );
}