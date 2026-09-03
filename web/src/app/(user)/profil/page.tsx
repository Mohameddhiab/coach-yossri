"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Cake,
  CalendarDays,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/components/page-header";
import { PageLoader } from "@/shared/components/page-loader";
import { UserAvatar } from "@/shared/components/user-avatar";
import { CoachContactButtons } from "@/shared/components/coach-contact-buttons";
import { ErrorState } from "@/shared/components/error-state";
import { XpBadgesCard } from "@/features/users/components/xp-badges-card";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { formatDate } from "@/lib/utils";
import { updateProfile, uploadAvatar } from "@/shared/lib/profile-api";
import { toast } from "sonner";

export default function MyProfilePage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMySubscription();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sexe, setSexe] = useState<string>("");
  const [tailleCm, setTailleCm] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <PageLoader rows={2} />;
  if (!data || isError)
    return <ErrorState onRetry={() => refetch()} retrying={isRefetching} />;

  const { user, coach } = data;

  function startEdit() {
    setNom(user.nom);
    setPrenom(user.prenom);
    setTelephone(user.telephone);
    setSexe(user.sexe ?? "");
    setTailleCm(user.taille_cm?.toString() ?? "");
    setDateNaissance(
      user.date_naissance ? user.date_naissance.slice(0, 10) : "",
    );
    setAvatarPreview(null);
    setEditing(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الصورة كبيرة جداً (الحد 5 ميغابايت)");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(file);
      await refetch();
      toast.success("تم تحديث الصورة");
      return result;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "فشل رفع الصورة";
      toast.error(msg);
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        nom,
        prenom,
        telephone,
        sexe: sexe || null,
        taille_cm: tailleCm ? Number(tailleCm) : null,
        date_naissance: dateNaissance || null,
      });
      await refetch();
      setEditing(false);
      toast.success("تم حفظ التعديلات");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "فشل حفظ التعديلات";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ملفي" description="معلوماتك الشخصية ومدربك" />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">معلوماتي</CardTitle>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={startEdit}>
                <User className="size-4 ml-1" />
                تعديل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-br from-primary via-ring to-primary p-0.5 animate-float">
                <UserAvatar
                  prenom={editing ? prenom : user.prenom}
                  nom={editing ? nom : user.nom}
                  src={avatarPreview ?? user.avatar_url}
                  className="size-14 ring-2 ring-background"
                />
              </div>
              {editing && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Camera className="size-3" />
                  </button>
                </>
              )}
            </div>
            <div>
              <div className="text-lg font-bold">
                {editing ? `${prenom} ${nom}` : `${user.prenom} ${user.nom}`}
              </div>
              <div className="text-xs text-muted-foreground">
                عضو منذ {formatDate(user.created_at)}
              </div>
            </div>
          </div>
          <Separator />
          {editing ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الاسم</Label>
                  <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>اللقب</Label>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>الهاتف</Label>
                <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الجنس</Label>
                  <Select value={sexe} onValueChange={setSexe}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOMME">ذكر</SelectItem>
                      <SelectItem value="FEMME">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>الطول (سم)</Label>
                  <Input
                    type="number"
                    value={tailleCm}
                    onChange={(e) => setTailleCm(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving || uploadingAvatar}>
                  <Save className="size-4 ml-1" />
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Mail className="size-4" />
                </span>
                <span dir="ltr">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Phone className="size-4" />
                </span>
                <span dir="ltr">{user.telephone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <Cake className="size-4" />
                </span>
                {user.date_naissance
                  ? formatDate(user.date_naissance)
                  : "—"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            مدربي
          </CardTitle>
          <CardDescription>
            تواصل معه للتجديد أو لأي استفسار
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {coach ? (
            <>
              <div className="font-bold">
                {coach.prenom} {coach.nom}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span dir="ltr">{coach.telephone}</span>
              </div>
              <CoachContactButtons telephone={coach.telephone} />
            </>
          ) : (
            <p className="text-muted-foreground">
              لا يوجد المدرب مرتبط بعد.
            </p>
          )}
        </CardContent>
      </Card>

      <XpBadgesCard />
    </div>
  );
}
