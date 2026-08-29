import { Inject, Injectable } from '@nestjs/common';
import type { Subscription } from '@/shared/domain/entities';
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '@/shared/domain/ports/stats-repository.port';
import { latestSubscription } from '@/shared/domain/stats';
import { getSubscriptionStatus } from '@/shared/domain/subscription-status';
import { StatsData } from '../stats-data';

@Injectable()
export class GetSummaryUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    private readonly data: StatsData,
  ) {}

  async execute(coachId: string) {
    const ctx = await this.data.load(coachId);
    const now = Date.now();
    const yes30 = now - 30 * 86400000;

    let actifs = 0;
    let expirant7j = 0;
    let expires = 0;
    let renouvellements = 0;
    let nouveaux30j = 0;
    let revenueTotal = 0;
    let membershipsTotal = 0;
    const tiers = { ONLINE: 0, PREMIUM_COACH: 0 };

    for (const m of ctx.members) {
      const list = ctx.subsByUser.get(m.id) ?? [];
      const latest = latestSubscription(list);
      const status = latest ? getSubscriptionStatus(latest) : 'AUCUN';

      if (status === 'ACTIF' || status === 'EXPIRE_BIENTOT') {
        if (status === 'ACTIF') actifs += 1;
        else expirant7j += 1;
        if (latest) {
          revenueTotal += latest.montant;
          if (latest.tier === 'ONLINE') tiers.ONLINE += 1;
          else tiers.PREMIUM_COACH += 1;
        }
      } else {
        expires += 1;
      }

      if (list.length >= 2) renouvellements += 1;
      if (m.createdAt.getTime() >= yes30) nouveaux30j += 1;
      if (list.length > 0) {
        const first = list.reduce((a, b) =>
          a.dateDebut.getTime() < b.dateDebut.getTime() ? a : b,
        );
        membershipsTotal += Math.max(
          0,
          Math.floor((now - first.dateDebut.getTime()) / (30 * 86400000)),
        );
      }
    }

    let revenue30j = 0;
    const subs30: Subscription[] = [];
    for (const s of await this.stats.allSubscriptions()) {
      if (!ctx.memberIds.has(s.userId)) continue;
      if (s.createdAt.getTime() >= yes30) revenue30j += s.montant;
      subs30.push(s);
    }

    const total = ctx.members.length;
    const payers = actifs + expirant7j;
    const checkins7j = ctx.checkIns.filter(
      (c) => c.checkedAt.getTime() >= now - 7 * 86400000,
    ).length;

    return {
      total,
      actifs,
      expirant7j,
      expires,
      nouveaux_30j: nouveaux30j,
      checkins_7j: checkins7j,
      renouvellements,
      ratio_renewal: total ? Math.round((renouvellements / total) * 100) : 0,
      taux_retention: total ? Math.round((payers / total) * 100) : 0,
      revenue_total: revenueTotal,
      revenue_mensuel: revenue30j,
      revenu_moyen_par_membre: payers
        ? Math.round((revenueTotal / payers) * 100) / 100
        : 0,
      revenu_par_tier: this.revenueByTier(subs30),
      membres_actifs: payers,
      tiers,
      membership_moyen_mois: total
        ? Math.round((membershipsTotal / total) * 10) / 10
        : 0,
    };
  }

  private revenueByTier(subs: Subscription[]) {
    const tiers = { ONLINE: 0, PREMIUM_COACH: 0 };
    for (const s of subs) {
      if (s.tier === 'ONLINE') tiers.ONLINE += s.montant;
      else if (s.tier === 'PREMIUM_COACH') tiers.PREMIUM_COACH += s.montant;
    }
    return tiers;
  }
}
