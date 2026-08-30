import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SENDER, type IEmailSender } from './domain/email-sender.port';
import { renderPasswordResetEmail } from './templates/password-reset';
import { renderWelcomeEmail } from './templates/welcome';
import { renderNewPlanEmail } from './templates/new-plan';
import { renderVerifyEmail } from './templates/verify-email';

const APP_URL =
  process.env.WEB_APP_URL?.replace(/\/+$/, '') ??
  'https://coach-yossri.vercel.app';

@Injectable()
export class EmailService {
  constructor(@Inject(EMAIL_SENDER) private readonly sender: IEmailSender) {}

  async sendPasswordReset(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sender.send({
      to,
      templateName: 'password-reset',
      subject: 'إعادة تعيين كلمة المرور — كوتش يسري',
      html: renderPasswordResetEmail(name, resetUrl),
    });
  }

  async sendWelcome(
    to: string,
    prenom: string,
    password: string,
  ): Promise<void> {
    await this.sender.send({
      to,
      templateName: 'welcome',
      subject: 'مرحباً بك في منصة كوتش يسري 💪',
      html: renderWelcomeEmail(prenom, to, password, `${APP_URL}/login`),
    });
  }

  async sendNewPlan(to: string, titre: string): Promise<void> {
    await this.sender.send({
      to,
      templateName: 'new-plan',
      subject: 'خطتك التدريبية والغذائية الجديدة جاهزة 🍽️',
      html: renderNewPlanEmail(titre, APP_URL),
    });
  }

  async sendVerifyEmail(
    to: string,
    name: string,
    confirmUrl: string,
  ): Promise<void> {
    await this.sender.send({
      to,
      templateName: 'verify-email',
      subject: 'أكّد بريدك الإلكتروني — كوتش يسري',
      html: renderVerifyEmail(name, confirmUrl),
    });
  }
}
