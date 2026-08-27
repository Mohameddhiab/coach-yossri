import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="text-xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        الصفحة التي تبحث عنها غير موجودة أو أن العنوان غير صحيح.
      </p>
      <Button asChild>
        <Link href="/">ارجع للبداية</Link>
      </Button>
    </div>
  );
}