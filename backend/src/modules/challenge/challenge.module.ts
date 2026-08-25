import { Global, Module } from "@nestjs/common";
import { ChallengeController } from "./presentation/challenge.controller";

@Global()
@Module({
  controllers: [ChallengeController],
})
export class ChallengeModule {}