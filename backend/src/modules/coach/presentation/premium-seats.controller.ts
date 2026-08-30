import { Controller, Get, Inject } from '@nestjs/common';
import {
  COACH_REPOSITORY,
  type CoachRepository,
} from '@/shared/domain/ports/coach-repository.port';

@Controller('premium-seats')
export class PremiumSeatsController {
  constructor(
    @Inject(COACH_REPOSITORY) private readonly coach: CoachRepository,
  ) {}

  @Get()
  async get() {
    const s = await this.coach.settings();
    return {
      total: s.totalSeats,
      remaining: s.remainingSeats,
      full: s.remainingSeats <= 0,
    };
  }
}
