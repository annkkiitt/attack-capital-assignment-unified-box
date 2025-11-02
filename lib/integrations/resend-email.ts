import { Resend } from 'resend';
import { ChannelSender, MessagePayload, MessageResponse, Channel, MessageStatus } from './types';
import { MessagePayloadSchema } from './types';

/**
 * Resend Email Channel Sender
 * Handles email messaging via Resend API
 */
export class ResendEmailSender implements ChannelSender {
  private client: Resend;
  private apiKey: string;
  private defaultFromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!this.apiKey) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable');
    }

    this.client = new Resend(this.apiKey);
  }

  getChannel(): Channel {
    return 'email';
  }

  validate(payload: MessagePayload): { valid: boolean; error?: string } {
    // Validate payload structure
    const result = MessagePayloadSchema.safeParse(payload);
    if (!result.success) {
      return {
        valid: false,
        error: `Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`,
      };
    }

    // Channel-specific validations
    if (payload.channel !== 'email') {
      return { valid: false, error: 'Channel mismatch: expected Email' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.to)) {
      return { valid: false, error: 'Invalid email address format' };
    }

    // Phone numbers not allowed for email
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phoneRegex.test(payload.to)) {
      return { valid: false, error: 'Phone numbers cannot be used for email channel' };
    }

    // Subject is required for email
    if (!payload.subject && !payload.body) {
      return { valid: false, error: 'Email requires either subject or body' };
    }

    return { valid: true };
  }

  async send(payload: MessagePayload): Promise<MessageResponse> {
    // Validate payload
    const validation = this.validate(payload);
    if (!validation.valid) {
      return {
        success: false,
        messageId: '',
        status: 'failed',
        channel: 'email',
        error: validation.error,
      };
    }

    try {
      const from = payload.from || this.defaultFromEmail;
      const subject = payload.subject || payload.body.substring(0, 50) || 'No Subject';

      // Prepare attachments if present
      // Resend expects either content (Buffer or base64 string) or path (URL/file path)
      const attachments = payload.attachments?.map(att => {
        if (att.base64) {
          return {
            filename: att.filename,
            content: Buffer.from(att.base64, 'base64'),
          };
        } else if (att.url) {
          return {
            filename: att.filename,
            path: att.url,
          };
        }
        return null;
      }).filter((att): att is { filename: string; content: Buffer } | { filename: string; path: string } => att !== null) || [];

      // Send email via Resend
      const { data, error } = await this.client.emails.send({
        from: from,
        to: payload.to,
        subject: subject,
        html: payload.htmlBody || `<p>${payload.body.replace(/\n/g, '<br>')}</p>`,
        text: payload.body, // Plain text fallback
        attachments: attachments.length > 0 ? attachments : undefined,
        tags: payload.metadata ? Object.entries(payload.metadata).map(([key, value]) => ({
          name: key,
          value: value,
        })) : undefined,
      });

      if (error) {
        return {
          success: false,
          messageId: '',
          status: 'failed',
          channel: 'email',
          error: `Resend API error: ${error.message}`,
        };
      }

      return {
        success: true,
        messageId: data?.id || '',
        status: 'sent', // Resend doesn't provide delivery status immediately
        channel: 'email',
        externalId: data?.id,
        metadata: {
          from: from,
          subject: subject,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        messageId: '',
        status: 'failed',
        channel: 'email',
        error: `Resend email error: ${errorMessage}`,
      };
    }
  }
}

