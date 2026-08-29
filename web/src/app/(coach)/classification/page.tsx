"use client";

import { PageHeader } from "@/shared/components/page-header";
import { ChallengeCard } from "@/features/goals/components/challenge-card";

export default function ClassificationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التصنيف"
        description="ترتيب الأعضاء حسب حضور الحصص — اختر الفترة"
      />
      <ChallengeCard coach />
    </div>
  );
}