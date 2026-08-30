import type { CheckIn } from '../entities';

export const CHECKIN_REPOSITORY = Symbol('CheckInRepository');

export interface CheckInWithUser extends CheckIn {
  userName: string;
  userPrenom: string;
}

export interface CheckInRepository {
  create(userId: string, coachId: string): Promise<CheckIn>;
  listByUser(userId: string, limit?: number): Promise<CheckIn[]>;
  listToday(coachId: string): Promise<CheckInWithUser[]>;
}
