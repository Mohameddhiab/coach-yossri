import { Global, Module } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { SubscriptionGuard } from "./subscription.guard";
import { TierGuard } from "./tier.guard";

@Global()
@Module({
  providers: [JwtAuthGuard, RolesGuard, SubscriptionGuard, TierGuard],
  exports: [JwtAuthGuard, RolesGuard, SubscriptionGuard, TierGuard],
})
export class GuardsModule {}