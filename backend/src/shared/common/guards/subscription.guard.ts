import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '@/shared/database/prisma.service';
import { getSubscriptionStatus } from '@/shared/domain/subscription-status';
import { fail } from '../errors/domain-exception';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    if (getSubscriptionStatus(subscription) === 'EXPIRE') {
      fail(
        403,
        'SUBSCRIPTION_EXPIRED',
        'اشتراكك منتهٍ — تواصل مع مدربك للتجديد',
      );
    }
    return true;
  }
}
