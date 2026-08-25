import { Injectable, Logger } from "@nestjs/common";
import type { EmailMessage, IEmailSender } from "../domain/email-sender.port";

@Injectable()
export class ConsoleEmailAdapter implements IEmailSender {
  private readonly logger = new Logger("Email");

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `[${message.templateName}] to=${message.to} subject="${message.subject}"`,
    );
    const links = Array.from(message.html.matchAll(/href="([^"]+)"/g)).map((m) => m[1]);
    for (const link of links) {
      this.logger.log(`[${message.templateName}] link: ${link}`);
    }
  }
}
