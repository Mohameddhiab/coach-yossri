export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  templateName: string;
}

export interface IEmailSender {
  send(message: EmailMessage): Promise<void>;
}

export const EMAIL_SENDER = Symbol('IEmailSender');
