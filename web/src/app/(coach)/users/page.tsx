"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { UsersTable } from "@/features/users/components/users-table";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الأعضاء"
        description="قائمة أعضائك واشتراكاتهم وحالتهم"
        actions={
          <Button asChild>
            <Link href="/users/new">
              <UserPlus />
              أضف عضو
            </Link>
          </Button>
        }
      />
      <UsersTable />
    </div>
  );
}