import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/shared/database/prisma.service";

export interface CreateResetToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  invalidateAllForUser(userId: string): Promise<unknown> {
    return this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { expiresAt: new Date(0) },
    });
  }

  create(data: CreateResetToken) {
    return this.prisma.passwordResetToken.create({ data });
  }

  findValid(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  markUsed(id: string): Promise<unknown> {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
