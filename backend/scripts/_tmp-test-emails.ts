import { EmailService } from '@/shared/email/email.service';
import { BrevoHttpEmailAdapter } from '@/shared/email/infrastructure/brevo-http-email.adapter';

(async () => {
  const adapter = new BrevoHttpEmailAdapter();
  const email = new EmailService(adapter as never);
  await email.sendWelcome(process.env.TEST_TO!, 'يوسف', 'Tmp!Pass123');
  console.log('welcome sent OK');
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});