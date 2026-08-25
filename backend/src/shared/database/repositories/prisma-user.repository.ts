import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/shared/database/prisma.service";
import { USER_REPOSITORY, type UserRepository } from "@/shared/domain/ports/user-repository.port";
import type { NotificationPrefs, User } from "@/shared/domain/entities";
import { DEFAULT_PREFS } from "@/shared/domain/entities";
import { Prisma } from "@prisma/client";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    role: string;
    email: string;
    nom: string;
    prenom: string;
    telephone: string;
    dateNaissance: Date | null;
    sexe: string | null;
    tailleCm: number | null;
    coachId: string | null;
    referredBy: string | null;
    createdAt: Date;
  }): User {
    return {
      id: row.id,
      role: row.role as User["role"],
      email: row.email,
      nom: row.nom,
      prenom: row.prenom,
      telephone: row.telephone,
      dateNaissance: row.dateNaissance,
      sexe: row.sexe as User["sexe"],
      tailleCm: row.tailleCm,
      coachId: row.coachId,
      referredBy: row.referredBy,
      createdAt: row.createdAt,
    };
  }

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? { ...this.map(row), passwordHash: row.passwordHash } : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async listByRole(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.map(r));
  }

  async create(data: Parameters<UserRepository["create"]>[0]): Promise<User> {
    const row = await this.prisma.user.create({ data });
    return this.map(row);
  }

  async update(
    id: string,
    patch: Partial<Pick<User, "nom" | "prenom" | "telephone" | "dateNaissance" | "sexe" | "tailleCm">>,
  ): Promise<User> {
    const data: Prisma.UserUpdateInput = {};
    if (patch.nom !== undefined) data.nom = patch.nom;
    if (patch.prenom !== undefined) data.prenom = patch.prenom;
    if (patch.telephone !== undefined) data.telephone = patch.telephone;
    if (patch.dateNaissance !== undefined) data.dateNaissance = patch.dateNaissance;
    if (patch.sexe !== undefined) data.sexe = patch.sexe;
    if (patch.tailleCm !== undefined) data.tailleCm = patch.tailleCm;
    const row = await this.prisma.user.update({ where: { id }, data });
    return this.map(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async prefsOf(userId: string): Promise<NotificationPrefs | null> {
    const row = await this.prisma.notificationPrefs.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      userId: row.userId,
      rappelPoids: row.rappelPoids,
      motivation: row.motivation,
      expirationProche: row.expirationProche,
      nouveauPlan: row.nouveauPlan,
    };
  }

  async savePrefs(userId: string, prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const defined = Object.fromEntries(
      Object.entries(prefs).filter(([, v]) => v !== undefined),
    ) as Partial<NotificationPrefs>;
    const merged = { ...DEFAULT_PREFS, ...defined };
    const row = await this.prisma.notificationPrefs.upsert({
      where: { userId },
      update: {
        rappelPoids: merged.rappelPoids,
        motivation: merged.motivation,
        expirationProche: merged.expirationProche,
        nouveauPlan: merged.nouveauPlan,
      },
      create: { userId, ...merged },
    });
    return {
      userId: row.userId,
      rappelPoids: row.rappelPoids,
      motivation: row.motivation,
      expirationProche: row.expirationProche,
      nouveauPlan: row.nouveauPlan,
    };
  }
}

export const PrismaUserRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: PrismaUserRepository,
};