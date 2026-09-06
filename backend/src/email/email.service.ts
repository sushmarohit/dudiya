import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress = 'Dudiya <noreply@dudiya.local>';

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.warn(
        'SMTP_HOST not set — emails will be logged to the console only. Forgot-password and activation links will not be delivered by email.',
      );
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS') ?? '';
    const secure =
      this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const from = this.config.get<string>('SMTP_FROM')?.trim();

    if (from) this.fromAddress = from;

    const options: SMTPTransport.Options = {
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    };

    this.transporter = nodemailer.createTransport(options);
    this.logger.log(`SMTP email transport ready (${host}:${port})`);
  }

  isConfigured(): boolean {
    return this.transporter != null;
  }

  async send(input: SendEmailInput): Promise<{ sent: boolean }> {
    if (!this.transporter) {
      this.logger.warn(
        `[email:console] to=${input.to} subject="${input.subject}"\n${input.text}`,
      );
      return { sent: false };
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { sent: true };
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${input.to}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  async sendPasswordReset(to: string, resetUrl: string, name?: string | null) {
    const greeting = name ? `Hi ${name},` : 'Hi,';
    const subject = 'Reset your Dudiya password';
    const text = [
      greeting,
      '',
      'We received a request to reset your password.',
      `Open this link to choose a new password (valid for 1 hour):`,
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
        <p>${escapeHtml(greeting)}</p>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${escapeHtml(resetUrl)}"
             style="display:inline-block;background:#059669;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">
            Reset password
          </a>
        </p>
        <p style="font-size:14px;color:#475569;">Or copy this link (valid for 1 hour):<br/>
          <a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a>
        </p>
        <p style="font-size:14px;color:#64748b;">If you did not request this, you can ignore this email.</p>
      </div>
    `;

    return this.send({ to, subject, html, text });
  }

  async sendAccountActivation(
    to: string,
    activationUrl: string,
    name?: string | null,
  ) {
    const greeting = name ? `Hi ${name},` : 'Hi,';
    const subject = 'Activate your Dudiya account';
    const text = [
      greeting,
      '',
      'Your distributor invited you to Dudiya.',
      `Open this link to set your password and activate your account (valid for 7 days):`,
      activationUrl,
      '',
      'If you were not expecting this, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
        <p>${escapeHtml(greeting)}</p>
        <p>Your distributor invited you to Dudiya.</p>
        <p>
          <a href="${escapeHtml(activationUrl)}"
             style="display:inline-block;background:#059669;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">
            Activate account
          </a>
        </p>
        <p style="font-size:14px;color:#475569;">Or copy this link (valid for 7 days):<br/>
          <a href="${escapeHtml(activationUrl)}">${escapeHtml(activationUrl)}</a>
        </p>
        <p style="font-size:14px;color:#64748b;">If you were not expecting this, you can ignore this email.</p>
      </div>
    `;

    return this.send({ to, subject, html, text });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
