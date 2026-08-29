import { Global, Module, type Type } from '@nestjs/common';
import { EMAIL_SENDER, type IEmailSender } from './domain/email-sender.port';
import { ConsoleEmailAdapter } from './infrastructure/console-email.adapter';
import { NodemailerEmailAdapter } from './infrastructure/nodemailer-email.adapter';
import { BrevoHttpEmailAdapter } from './infrastructure/brevo-http-email.adapter';
import { EmailService } from './email.service';

function resolveEmailAdapter(): Type<IEmailSender> {
  const driver = process.env.EMAIL_DRIVER ?? 'console';
  switch (driver) {
    case 'brevo':
      return BrevoHttpEmailAdapter;
    case 'smtp':
      return NodemailerEmailAdapter;
    default:
      return ConsoleEmailAdapter;
  }
}

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: resolveEmailAdapter(),
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
