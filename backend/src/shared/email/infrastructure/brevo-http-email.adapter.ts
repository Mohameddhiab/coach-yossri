import { Injectable, Logger } from '@nestjs/common';
import type { EmailMessage, IEmailSender } from '../domain/email-sender.port';
import { htmlToText } from './html-to-text';

const BREVO_API_URL = 'https://api.brevo.com/v3';

@Injectable()
export class BrevoHttpEmailAdapter implements IEmailSender {
  private readonly logger = new Logger('Email');
  private readonly fromName: string;
  private readonly fromEmail: string;
  private readonly configured: boolean;

  constructor() {
    const match = /^\s*(.*?)\s*<([^>]+)>/.exec(process.env.MAIL_FROM ?? '');
    this.fromName = match?.[1]?.trim() || '9AWI';
    this.fromEmail =
      match?.[2]?.trim() ??
      process.env.MAIL_FROM?.trim() ??
      'no-reply@localhost';
    this.configured = Boolean(process.env.BREVO_API_KEY && this.fromEmail);

    if (!this.configured) {
      this.logger.warn(
        '[brevo] EMAIL_DRIVER=brevo mais BREVO_API_KEY ou MAIL_FROM manquants — emails désactivés',
      );
      return;
    }
    this.verify();
  }

  private verify(): void {
    setTimeout(() => {
      const started = Date.now();
      fetch(`${BREVO_API_URL}/account`, {
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          Accept: 'application/json',
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.text().catch(() => '');
            this.logger.error(
              `[brevo] clé API invalide (HTTP ${res.status}) — ${body.slice(0, 300)}`,
            );
            return;
          }
          this.logger.log(
            `[brevo] API OK (${Date.now() - started}ms) — expéditeur: ${this.fromName} <${this.fromEmail}>`,
          );
        })
        .catch((error) =>
          this.logger.error(
            '[brevo] vérification API échouée',
            error instanceof Error ? error.message : String(error),
          ),
        );
    }, 500);
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.configured) {
      this.logger.warn(
        `[brevo] non configuré — email ignoré template=${message.templateName} to=${message.to}`,
      );
      return;
    }

    try {
      const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
          textContent: htmlToText(message.html),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(
          `[brevo] HTTP ${res.status} template=${message.templateName} to=${message.to} — ${body.slice(0, 400)}`,
        );
        return;
      }
      this.logger.log(
        `[brevo] sent template=${message.templateName} to=${message.to}`,
      );
    } catch (error) {
      this.logger.error(
        `[brevo] failed template=${message.templateName} to=${message.to}`,
        error instanceof Error ? error.message : String(error),
      );
      // L'échec d'envoi ne doit jamais bloquer le flow utilisateur
    }
  }
}
