import { Global, Module } from "@nestjs/common";
import { EMAIL_SENDER } from "./domain/email-sender.port";
import { ConsoleEmailAdapter } from "./infrastructure/console-email.adapter";
import { NodemailerEmailAdapter } from "./infrastructure/nodemailer-email.adapter";
import { EmailService } from "./email.service";

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: (process.env.EMAIL_DRIVER ?? "console") === "smtp"
        ? NodemailerEmailAdapter
        : ConsoleEmailAdapter,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
