import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SENDER, type IEmailSender } from './domain/email-sender.port';
import { renderPasswordResetEmail } from './templates/password-reset';

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

  async sendWelcome(to: string, password: string): Promise<void> {
    await this.sender.send({
      to,
      templateName: 'welcome',
      subject: 'مرحباً بك في منصة التدريب الرياضي 💪',
      html: `<p>تم إنشاء حسابك بنجاح في المنصة التدريبية.</p><p>البريد الإلكتروني: ${to}<br/>كلمة المرور المؤقتة: <b>${password}</b></p><p>يُرجى تغيير كلمة المرور من صفحة الإعدادات بعد أول تسجيل دخول.</p>`,
    });
  }

  async sendNewPlan(to: string, titre: string): Promise<void> {
    await this.sender.send({
      to,
      templateName: 'new-plan',
      subject: 'خطتك التدريبية والغذائية الجديدة جاهزة 🍽️',
      html: `<p>قام المدرب بإعداد خطة جديدة لك: <b>${titre}</b></p><p>افتح التطبيق لمتابعة تفاصيل خطتك.</p>`,
    });
  }
}
