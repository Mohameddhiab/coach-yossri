import { Module } from '@nestjs/common';
import { WgerApiAdapter } from './infrastructure/external/wger-api.adapter';
import { ExerciseImageService } from './application/exercise-image.service';
import {
  EnsureCuratedExercisesUseCase,
  ImportExerciseFromWgerUseCase,
  ListLocalExercisesUseCase,
  SearchWgerExercisesUseCase,
} from './application/use-cases/exercises.use-cases';
import { ExercisesController } from './presentation/exercises.controller';

@Module({
  controllers: [ExercisesController],
  providers: [
    WgerApiAdapter,
    ExerciseImageService,
    SearchWgerExercisesUseCase,
    ImportExerciseFromWgerUseCase,
    ListLocalExercisesUseCase,
    EnsureCuratedExercisesUseCase,
  ],
})
export class ExercisesModule {}
