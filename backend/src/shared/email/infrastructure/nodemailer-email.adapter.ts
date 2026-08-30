import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailMessage, IEmailSender } from '../domain/email-sender.port';
import { htmlToText } from './html-to-text';

@Injectable()
export class NodemailerEmailAdapter implements IEmailSender {
  private readonly logger = new Logger('Email');
  private readonly transporter: Transporter | null = null;
  private readonly from: string;
  private readonly configured: boolean;

  constructor() {
    const host = process.env.SMTP_HOST ?? '';
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = (process.env.SMTP_SECURE ?? String(port === 465)) === 'true';
    const user = process.env.SMTP_USER ?? '';
    const pass = process.env.SMTP_PASS ?? '';
    this.configured = Boolean(host && user && pass);
    this.from =
      process.env.MAIL_FROM ??
      (user ? `Coach Yosri <${user}>` : 'Coach Yosri <no-reply@localhost>');

    if (!this.configured) {
      this.logger.warn(
        '[smtp] EMAIL_DRIVER=smtp mais SMTP_HOST/SMTP_USER/SMTP_PASS manquants — emails désactivés',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    this.verify(this.transporter);
  }

  private verify(transporter: Transporter): void {
    setTimeout(() => {
      this.logger.log(
        `[smtp] vérification de la connexion vers ${process.env.SMTP_HOST}...`,
      );
      const TIMEOUT_MS = 10_000;
      Promise.race([
        transporter.verify(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`timeout après ${TIMEOUT_MS}ms`)),
            TIMEOUT_MS,
          ),
        ),
      ])
        .then(() => this.logger.log('[smtp] connexion SMTP OK'))
        .catch((error) =>
          this.logger.error(
            '[smtp] connexion SMTP échouée — vérifiez SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS',
            error instanceof Error ? error.message : String(error),
          ),
        );
    }, 1500);
  }

  private htmlToText(html: string): string {
    return htmlToText(html);
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.configured || !this.transporter) {
      this.logger.warn(
        `[smtp] non configuré — email ignoré template=${message.templateName} to=${message.to}`,
      );
      return;
    }

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
      // L'échec d'envoi ne doit jamais bloquer le flow utilisateur
    }
  }
}
