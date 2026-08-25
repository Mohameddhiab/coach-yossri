import { Inject, Injectable } from "@nestjs/common";
import { EMAIL_SENDER, type IEmailSender } from "./domain/email-sender.port";
import { renderPasswordResetEmail } from "./templates/password-reset";

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
      templateName: "password-reset",
      subject: "تغيير كلمة السر — قاوي",
      html: renderPasswordResetEmail(name, resetUrl),
    });
  }

  async sendWelcome(to: string, password: string): Promise<void> {
    await this.sender.send({
      to,
      templateName: "welcome",
      subject: "مرحباً بك في قاوي 💪",
      html: `<p>تم إنشاء حسابك في تطبيق قاوي.</p><p>بريدك: ${to}<br/>كلمة السر المؤقتة: <b>${password}</b></p><p>غيّرها من الإعدادات بعد أول دخول.</p>`,
    });
  }

  async sendNewPlan(to: string, titre: string): Promise<void> {
    await this.sender.send({
      to,
      templateName: "new-plan",
      subject: "خطتك الجديدة جاهزة 🍽️",
      html: `<p>كوتشك وضع لك خطة جديدة: <b>${titre}</b></p><p>افتح التطبيق لرؤيتها.</p>`,
    });
  }
}