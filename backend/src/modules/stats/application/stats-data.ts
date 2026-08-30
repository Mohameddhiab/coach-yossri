import { Inject, Injectable } from '@nestjs/common';
import type {
  CheckIn,
  MonthlyGoal,
  Subscription,
  User,
  WeightLog,
  WeightTarget,
} from '@/shared/domain/entities';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/shared/domain/ports/user-repository.port';

export interface StatsContext {
  members: User[];
  memberIds: Set<string>;
  subsByUser: Map<string, Subscription[]>;
  weightsByUser: Map<string, WeightLog[]>;
  targetsByUser: Map<string, WeightTarget[]>;
  goalsByUser: Map<string, MonthlyGoal[]>;
  checkIns: CheckIn[];
  versionsByUser: Map<string, number>;
  noteCountsByUser: Map<string, number>;
}

const CACHE_TTL_MS = 30_000;

@Injectable()
export class StatsData {
  private readonly cache = new Map<string, { at: number; ctx: StatsContext }>();

  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async membersOf(coachId: string): Promise<User[]> {
    return this.users.listByCoach(coachId);
  }

  clearCache(coachId?: string): void {
    if (coachId) this.cache.delete(coachId);
    else this.cache.clear();
  }

  async load(coachId: string): Promise<StatsContext> {
    const now = Date.now();
    const cached = this.cache.get(coachId);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      return cached.ctx;
    }

    const ctx = await this.loadFresh(coachId);
    this.cache.set(coachId, { at: now, ctx });
    return ctx;
  }

  async loadFresh(coachId: string): Promise<StatsContext> {
    const members = await this.membersOf(coachId);
    const memberIds = new Set(members.map((m) => m.id));
    const ids = [...memberIds];

    const [
      allSubs,
      allWeights,
      allTargets,
      allGoals,
      allCheckIns,
      plans,
      notes,
    ] = await Promise.all([
      this.stats.subscriptionsOf(ids),
      this.stats.weightLogsOf(ids),
      this.stats.weightTargetsOf(ids),
      this.stats.goalsOf(ids),
      this.stats.checkInsOf(ids),
      this.stats.mealPlanVersionsOf(ids),
      this.stats.noteCountsOf(ids),
    ]);

    const subsByUser = new Map<string, Subscription[]>();
    const weightsByUser = new Map<string, WeightLog[]>();
    const targetsByUser = new Map<string, WeightTarget[]>();
    const goalsByUser = new Map<string, MonthlyGoal[]>();
    const versionsByUser = new Map<string, number>();
    const noteCountsByUser = new Map<string, number>();
    const checkIns: CheckIn[] = [];

    const push = <T>(map: Map<string, T[]>, key: string, item: T) => {
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    };

    // versions: garder le plus récent par membre (liste triée desc)
    const seenPlan = new Set<string>();
    for (const p of plans) {
      if (seenPlan.has(p.userId)) continue;
      seenPlan.add(p.userId);
      versionsByUser.set(p.userId, p.version);
    }

    for (const s of allSubs) push(subsByUser, s.userId, s);
    for (const w of allWeights) push(weightsByUser, w.userId, w);
    for (const t of allTargets)
      if (memberIds.has(t.userId)) push(targetsByUser, t.userId, t);
    for (const g of allGoals) push(goalsByUser, g.userId, g);
    for (const c of allCheckIns) if (memberIds.has(c.userId)) checkIns.push(c);
    for (const n of notes) noteCountsByUser.set(n.userId, n.count);

    return {
      members,
      memberIds,
      subsByUser,
      weightsByUser,
      targetsByUser,
      goalsByUser,
      checkIns,
      versionsByUser,
      noteCountsByUser,
    };
  }
}
