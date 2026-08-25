"use client";

import type { ReactNode } from "react";
import { CoachShell } from "@/shared/components/shells/coach-shell";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return <CoachShell>{children}</CoachShell>;
}
