/**
 * Mock email sender.
 *
 * Logs to stdout in dev; in production this is where an SMTP / SES / Resend
 * adapter would go. Kept intentionally minimal so the delivery layer can be
 * swapped without touching notification business logic.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailTransport implements EmailTransport {
  async send(message: EmailMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.info(
      `\n📧 [mock-email] to=${message.to}\n    subject: ${message.subject}\n    ${message.body}\n`,
    );
  }
}

export const emailTransport: EmailTransport = new ConsoleEmailTransport();
