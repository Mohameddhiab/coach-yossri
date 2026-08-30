import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

export interface CreateVerifyToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  invalidateAllForUser(userId: string): Promise<unknown> {
    return this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { expiresAt: new Date(0) },
    });
  }

  create(data: CreateVerifyToken) {
    return this.prisma.emailVerificationToken.create({ data });
  }

  findValid(tokenHash: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  markUsed(id: string): Promise<unknown> {
    return this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
