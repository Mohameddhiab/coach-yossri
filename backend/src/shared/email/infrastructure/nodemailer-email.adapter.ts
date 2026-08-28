import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailMessage, IEmailSender } from '../domain/email-sender.port';

@Injectable()
export class NodemailerEmailAdapter implements IEmailSender {
  private readonly logger = new Logger('Email');
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST ?? '';
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = (process.env.SMTP_SECURE ?? String(port === 465)) === 'true';
    const user = process.env.SMTP_USER ?? '';
    const pass = process.env.SMTP_PASS ?? '';
    this.from = process.env.MAIL_FROM ?? `9AWI <${user}>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: this.htmlToText(message.html),
      });
      this.logger.log(
        `[smtp] sent template=${message.templateName} to=${message.to}`,
      );
    } catch (error) {
      this.logger.error(
        `[smtp] failed template=${message.templateName} to=${message.to}`,
        error instanceof Error ? error.message : String(error),
      );
      // Ne pas propager l'erreur en dev — l'envoi d'email ne doit pas bloquer la création utilisateur
      if ((process.env.EMAIL_DRIVER ?? 'console') === 'smtp') {
        // En prod SMTP, on log seulement et on continue pour ne pas casser le flow utilisateur
        return;
      }
      throw error;
    }
  }
}
