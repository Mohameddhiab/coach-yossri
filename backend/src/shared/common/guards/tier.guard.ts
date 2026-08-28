import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '@/shared/database/prisma.service';
import { getActiveTier, TIER_RANK } from '@/shared/domain/subscription-tier';
import type { SubscriptionTier } from '@/shared/domain/domain-types';
import { fail } from '../errors/domain-exception';
import { REQUIRED_TIER_KEY } from '../decorators/require-tier.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class TierGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<
      SubscriptionTier | undefined
    >(REQUIRED_TIER_KEY, [context.getHandler(), context.getClass()]);
    if (!required) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = req.user;
    if (!user || user.role !== 'USER') return true;

    let targetId =
      (req.params as Record<string, string>)?.userId ?? user.userId;
    if (targetId === 'me') targetId = user.userId;
    if (targetId !== user.userId) {
      fail(403, 'FORBIDDEN', 'غير مصرح به');
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: user.userId },
      orderBy: { dateFin: 'desc' },
    });
    const tier = getActiveTier(subscription);
    if (!tier || TIER_RANK[tier] < TIER_RANK[required]) {
      fail(403, 'TIER_REQUIRED', `هذه الميزة تتطلب اشتراك ${required}`);
    }
    return true;
  }
}
