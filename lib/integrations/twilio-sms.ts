import twilio from 'twilio';
import { ChannelSender, MessagePayload, MessageResponse, Channel, MessageStatus } from './types';
import { MessagePayloadSchema } from './types';

/**
 * Twilio SMS Channel Sender
 * Handles SMS and MMS messaging via Twilio API
 */
export class TwilioSMSSender implements ChannelSender {
  private client: twilio.Twilio;
  private accountSid: string;
  private authToken: string;
  private defaultFromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.defaultFromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  getChannel(): Channel {
    return 'sms';
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
    if (payload.channel !== 'sms') {
      return { valid: false, error: 'Channel mismatch: expected SMS' };
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(payload.to)) {
      return { valid: false, error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' };
    }

    // Email not allowed for SMS
    if (payload.to.includes('@')) {
      return { valid: false, error: 'Email addresses cannot be used for SMS channel' };
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
        channel: 'sms',
        error: validation.error,
      };
    }

    try {
      const from = payload.from || this.defaultFromNumber;
      if (!from) {
        throw new Error('No sender phone number provided. Set TWILIO_PHONE_NUMBER or provide "from" in payload');
      }

      // Prepare media URLs if attachments are present (MMS)
      const mediaUrl: string[] | undefined = payload.attachments
        ?.filter(att => att.url)
        .map(att => att.url!)
        .filter((url): url is string => !!url);

      // Send SMS/MMS via Twilio
      const message = await this.client.messages.create({
        body: payload.body,
        from: from,
        to: payload.to,
        mediaUrl: mediaUrl && mediaUrl.length > 0 ? mediaUrl : undefined,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL, // Optional webhook for status updates
      });

      return {
        success: true,
        messageId: message.sid,
        status: this.mapTwilioStatus(message.status),
        channel: 'sms',
        externalId: message.sid,
        metadata: {
          accountSid: message.accountSid,
          price: message.price || '',
          priceUnit: message.priceUnit || '',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        messageId: '',
        status: 'failed',
        channel: 'sms',
        error: `Twilio SMS error: ${errorMessage}`,
      };
    }
  }

  /**
   * Map Twilio message status to our unified MessageStatus
   */
  private mapTwilioStatus(twilioStatus: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      queued: 'pending',
      sent: 'sent',
      sending: 'pending',
      delivered: 'delivered',
      undelivered: 'failed',
      failed: 'failed',
      received: 'read',
    };

    return statusMap[twilioStatus.toLowerCase()] || 'pending';
  }
}

