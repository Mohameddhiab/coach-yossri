"use client";

import { Crown } from "lucide-react";
import { UserAvatar } from "@/shared/components/user-avatar";
import type { ChallengeRank } from "@/features/users/api/users.api";

const MEDAL_COLORS = [
  "from-amber-400 to-yellow-500",
  "from-zinc-300 to-zinc-400",
  "from-orange-400 to-amber-600",
];
const RANK_LABEL = ["المركز الأول", "المركز الثاني", "المركز الثالث"];
const RANK_SIZE = ["size-20", "size-16", "size-16"];
const AVATAR_SIZE = ["size-14", "size-11", "size-11"];
const BAR_HEIGHT = ["h-28", "h-20", "h-16"];

export function LeaguePodium({ rows }: { rows: ChallengeRank[] }) {
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) return null;

  const ordered =
    top3.length === 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
        ? [top3[1], top3[0]]
        : [top3[0]];

  return (
    <div className="flex items-end justify-center gap-3 pt-2 pb-4">
      {ordered.map((row, displayIdx) => {
        const rank = top3.length === 3 ? [1, 0, 2][displayIdx] : displayIdx;
        const isWinner = rank === 0;
        return (
          <div key={row.pseudo} className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <UserAvatar
                src={row.avatar_url}
                prenom={row.pseudo === "أنت" ? "" : row.pseudo.split(".")[0]?.trim() ?? ""}
                nom={row.pseudo === "أنت" ? "" : row.pseudo.split(".")[1]?.trim() ?? ""}
                className={`${AVATAR_SIZE[rank]} ${isWinner ? "ring-2 ring-amber-400" : ""} text-xs`}
              />
              {isWinner && (
                <Crown className="absolute -top-2.5 left-1/2 -translate-x-1/2 size-5 text-amber-500 drop-shadow" />
              )}
            </div>
            <span className="max-w-[72px] truncate text-center text-xs font-semibold">
              {row.pseudo}
            </span>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
              {row.count} حصة
            </span>
            <div
              className={`w-16 rounded-t-lg bg-gradient-to-b ${MEDAL_COLORS[rank]} ${BAR_HEIGHT[rank]} flex items-start justify-center pt-2`}
            >
              <span className="text-xs font-black text-white drop-shadow-sm">
                #{rank + 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
