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

@Injectable()
export class StatsData {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async membersOf(coachId: string): Promise<User[]> {
    const all = await this.users.listByRole();
    return all.filter((u) => u.coachId === coachId);
  }

  async load(coachId: string): Promise<StatsContext> {
    const members = await this.membersOf(coachId);
    const memberIds = new Set(members.map((m) => m.id));

    const [
      ,
      allSubs,
      allWeights,
      allTargets,
      allGoals,
      allCheckIns,
      plans,
      notes,
    ] = await Promise.all([
      Promise.resolve(),
      this.stats.allSubscriptions(),
      this.stats.allWeightLogs(),
      this.stats.allWeightTargets(),
      this.stats.allGoals(),
      this.stats.allCheckIns(),
      this.stats.activeMealPlanVersions(),
      this.stats.noteCounts(),
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

    for (const s of allSubs)
      if (memberIds.has(s.userId)) push(subsByUser, s.userId, s);
    for (const w of allWeights)
      if (memberIds.has(w.userId)) push(weightsByUser, w.userId, w);
    for (const t of allTargets)
      if (memberIds.has(t.userId)) push(targetsByUser, t.userId, t);
    for (const g of allGoals)
      if (memberIds.has(g.userId)) push(goalsByUser, g.userId, g);
    for (const c of allCheckIns) if (memberIds.has(c.userId)) checkIns.push(c);
    for (const p of plans)
      if (memberIds.has(p.userId)) versionsByUser.set(p.userId, p.version);
    for (const n of notes)
      if (memberIds.has(n.userId)) noteCountsByUser.set(n.userId, n.count);

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
