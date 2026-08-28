import { Global, Module } from '@nestjs/common';
import { PrismaProgressRepositoryProvider } from './infrastructure/prisma-progress.repository';
import { ProgressController } from './presentation/progress.controller';

@Global()
@Module({
  controllers: [ProgressController],
  providers: [PrismaProgressRepositoryProvider],
  exports: [PrismaProgressRepositoryProvider],
})
export class ProgressModule {}
