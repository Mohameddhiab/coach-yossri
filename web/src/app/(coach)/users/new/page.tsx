"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { BackButton } from "@/shared/components/back-button";
import { CreateUserForm } from "@/features/users/components/create-user-form";

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallback="/users" />
      <PageHeader
        title="أضف عضو جديد"
        description="صيّر الحساب — بيتم توليد كلمة سر تتسلّم للعضو"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات العضو</CardTitle>
          <CardDescription>
            لا يوجد إمكانية تسجيل عام — أنت اللي تصيّر الحسابات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
    </div>
  );
}