import {
  currentStreak,
  isCheckedToday,
  maxStreak,
  computeFidelity,
  projectWeight,
  estimateTargetDate,
  targetProgress,
  computeXp,
  computeBadges,
  computeEngagement,
  monthlyKeys,
  inMonth,
  dayKey,
} from './stats';

function day(offset: number): string {
  return dayKey(new Date(Date.now() - offset * 86400000));
}

describe('stats (streaks)', () => {
  it('returns 0 for empty history', () => {
    expect(currentStreak([])).toBe(0);
    expect(maxStreak([])).toBe(0);
    expect(isCheckedToday([])).toBe(false);
  });

  it('counts consecutive days ending today', () => {
    const endsToday = [day(0), day(1), day(2)];
    expect(currentStreak(endsToday)).toBe(3);
    expect(maxStreak(endsToday)).toBe(3);
    expect(isCheckedToday(endsToday)).toBe(true);
  });

  it('counts consecutive days ending yesterday', () => {
    const endsYesterday = [day(1), day(2), day(3)];
    expect(currentStreak(endsYesterday)).toBe(3);
    expect(isCheckedToday(endsYesterday)).toBe(false);
  });

  it('breaks the current streak when there is a gap', () => {
    expect(currentStreak([day(0), day(2), day(3)])).toBe(1);
    expect(maxStreak([day(0), day(2), day(3)])).toBe(2);
  });
});

describe('stats (fidelity)', () => {
  it('returns zeros/false for empty history', () => {
    const f = computeFidelity(null);
    expect(f.months).toBe(0);
    expect(f.level).toBeNull();
    expect(f.renewals).toBe(0);
  });

  it('computes months from the first subscription', () => {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 86400000);
    const f = computeFidelity([{ dateDebut: sixMonthsAgo }]);
    expect(f.months).toBeGreaterThanOrEqual(6);
    expect(f.level).toBe('SILVER');
    expect(f.nextLevel).toBe('GOLD');
  });
});

describe('stats (weight)', () => {
  const mk = (daysAgo: number, poidsKg: number) => ({
    date: new Date(Date.now() - daysAgo * 86400000),
    poidsKg,
  });

  it('needs at least two logs to project', () => {
    expect(projectWeight([mk(10, 90)])).toBeNull();
  });

  it('projects weight with a falling slope', () => {
    const proj = projectWeight([mk(30, 94), mk(15, 91), mk(1, 89)]);
    expect(proj).not.toBeNull();
    expect(proj!.slopePerWeek).toBeLessThan(0);
    expect(proj!.projected).toBeLessThan(89);
  });

  it('returns null when x is constant', () => {
    const t = new Date();
    expect(
      projectWeight([
        { date: t, poidsKg: 90 },
        { date: t, poidsKg: 91 },
      ]),
    ).toBeNull();
  });

  it('estimates a target date', () => {
    const est = estimateTargetDate([mk(20, 95), mk(10, 93), mk(1, 91)], 85);
    expect(est).not.toBeNull();
    expect(est!.days).toBeGreaterThan(0);
  });

  it('clamps progress between 0 and 100', () => {
    expect(targetProgress([mk(1, 90)], { poidsKg: 80 })).toBe(0);
    expect(targetProgress([mk(5, 100), mk(1, 95)], { poidsKg: 80 })).toBe(25);
  });
});

describe('stats (xp / badges / engagement)', () => {
  it('levels up across the XP ladder', () => {
    const xp0 = computeXp([], null, {
      months: 0,
      renewals: 0,
      level: null,
      monthsToNext: null,
      nextLevel: null,
    });
    expect(xp0.level.label).toBe('مبتدئ');
    const many = computeXp(
      Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000),
        poidsKg: 90,
      })),
      {
        cible: 30,
        checkins: ['2026-01-01'],
        checkinsCount: undefined,
      } as never,
      {
        months: 12,
        renewals: 3,
        level: 'GOLD',
        monthsToNext: null,
        nextLevel: null,
      },
    );
    expect(many.xp).toBeGreaterThan(400);
    expect(many.level.index).toBeGreaterThan(1);
  });

  it('unlocks weight badges', () => {
    const created = new Date(Date.now() - 400 * 86400000);
    const logs = Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 86400000),
      poidsKg: 98 - i,
    }));
    const badges = computeBadges({
      userCreatedAt: created,
      weightLogs: logs,
      goal: null,
      fidelity: {
        months: 13,
        renewals: 3,
        level: 'GOLD',
        monthsToNext: null,
        nextLevel: null,
      },
    });
    const ids = badges.filter((b) => b.unlocked).map((b) => b.badge.id);
    expect(ids).toContain('FIRST_WEIGH');
    expect(ids).toContain('REGULAR_10');
    expect(ids).toContain('LOST_5');
    expect(ids).toContain('MEMBER_1Y');
  });

  it('scores engagement by activity', () => {
    const sub = {
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 86400000),
      pauseStart: null,
    };
    const high = computeEngagement({
      subscription: sub,
      daysSinceLastWeight: 1,
      planVersion: 1,
    });
    expect(high.color).toBe('green');
    const low = computeEngagement({
      subscription: null,
      daysSinceLastWeight: 30,
      planVersion: null,
    });
    expect(low.score).toBeLessThan(40);
    expect(high.score).toBeGreaterThan(low.score);
  });
});

describe('stats (months)', () => {
  it('builds the expected number of keys', () => {
    expect(monthlyKeys(3).length).toBe(3);
  });

  it('flags membership in a month', () => {
    expect(inMonth(new Date(), new Date().toISOString().slice(0, 7))).toBe(
      true,
    );
    expect(
      inMonth(new Date('2020-01-01'), new Date().toISOString().slice(0, 7)),
    ).toBe(false);
  });
});
