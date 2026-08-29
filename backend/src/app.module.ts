import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/database/prisma.module';
import { SupabaseModule } from './shared/supabase/supabase.module';
import { EmailModule } from './shared/email/email.module';
import { GuardsModule } from './shared/common/guards/guards.module';
import { AuthModule } from './modules/auth/presentation/auth.module';
import { UsersModule } from './modules/users/presentation/users.module';
import { SubscriptionsModule } from './modules/subscriptions/presentation/subscriptions.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ProgressModule } from './modules/progress/progress.module';
import { MealPlansModule } from './modules/meal-plans/meal-plans.module';
import { CoachModule } from './modules/coach/coach.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { CheckInsModule } from './modules/check-ins/check-ins.module';
import { WorkoutPlansModule } from './modules/workout-plans/workout-plans.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ChatModule } from './modules/chat/chat.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    SupabaseModule,
    EmailModule,
    GuardsModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    GoalsModule,
    ProgressModule,
    MealPlansModule,
    CoachModule,
    ChallengeModule,
    CheckInsModule,
    WorkoutPlansModule,
    ExercisesModule,
    ChatModule,
    FollowUpsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
