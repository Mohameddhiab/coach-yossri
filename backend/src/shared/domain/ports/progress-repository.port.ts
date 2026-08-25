import type { ProgressPhoto, WeightLog, WeightTarget } from "../entities";

export const PROGRESS_REPOSITORY = Symbol("ProgressRepository");

export interface ProgressRepository {
  listWeights(userId: string): Promise<WeightLog[]>;
  addWeight(data: {
    userId: string;
    poidsKg: number;
    date: Date;
    note: string | null;
  }): Promise<WeightLog>;
  deleteWeight(logId: string): Promise<WeightLog | null>;
  findWeightById(logId: string): Promise<WeightLog | null>;
  lastWeight(userId: string): Promise<WeightLog | null>;
  targetOf(userId: string): Promise<WeightTarget | null>;
  setTarget(userId: string, poidsKg: number, date: Date): Promise<WeightTarget>;
  deleteTarget(userId: string): Promise<void>;
  listPhotos(userId: string): Promise<ProgressPhoto[]>;
  addPhoto(data: {
    userId: string;
    url: string;
    note: string | null;
  }): Promise<ProgressPhoto>;
  deletePhoto(photoId: string): Promise<ProgressPhoto | null>;
  findPhotoById(photoId: string): Promise<ProgressPhoto | null>;
}