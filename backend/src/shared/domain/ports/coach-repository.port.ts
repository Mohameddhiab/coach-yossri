import type { CoachNote, CoachSettings } from '../entities';

export const COACH_REPOSITORY = Symbol('CoachRepository');

export interface CoachRepository {
  settings(): Promise<CoachSettings>;
  saveSettings(
    patch: Partial<
      Pick<
        CoachSettings,
        | 'motivationMessage'
        | 'rappelIntervalJours'
        | 'sendMotivation'
        | 'messageTemplates'
        | 'totalSeats'
        | 'remainingSeats'
      >
    >,
  ): Promise<CoachSettings>;
  notesOf(userId: string): Promise<CoachNote[]>;
  noteCountsByUserIds(
    userIds: string[],
  ): Promise<{ userId: string; count: number }[]>;
  addNote(coachId: string, userId: string, contenu: string): Promise<CoachNote>;
  deleteNote(noteId: string): Promise<CoachNote | null>;
}
