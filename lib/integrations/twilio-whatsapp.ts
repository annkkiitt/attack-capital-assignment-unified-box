import twilio from 'twilio';
import { ChannelSender, MessagePayload, MessageResponse, Channel, MessageStatus } from './types';
import { MessagePayloadSchema } from './types';

/**
 * Twilio WhatsApp Channel Sender
 * Handles WhatsApp messaging via Twilio WhatsApp Sandbox
 * 
 * Note: In sandbox mode, messages can only be sent to verified numbers
 * To join sandbox: Send "join <keyword>" to the sandbox number
 */
export class TwilioWhatsAppSender implements ChannelSender {
  private client: twilio.Twilio;
  private accountSid: string;
  private authToken: string;
  private defaultFromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    // WhatsApp Sandbox number format: whatsapp:+14155238886
    this.defaultFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  getChannel(): Channel {
    return 'whatsapp';
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
    if (payload.channel !== 'whatsapp') {
      return { valid: false, error: 'Channel mismatch: expected WhatsApp' };
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const phoneNumber = payload.to.startsWith('whatsapp:') 
      ? payload.to.replace('whatsapp:', '') 
      : payload.to;
    
    if (!phoneRegex.test(phoneNumber)) {
      return { valid: false, error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' };
    }

    // Email not allowed for WhatsApp
    if (payload.to.includes('@')) {
      return { valid: false, error: 'Email addresses cannot be used for WhatsApp channel' };
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
        channel: 'whatsapp',
        error: validation.error,
      };
    }

    try {
      // Ensure WhatsApp format for from/to numbers
      const from = payload.from 
        ? (payload.from.startsWith('whatsapp:') ? payload.from : `whatsapp:${payload.from}`)
        : this.defaultFromNumber;
      
      const to = payload.to.startsWith('whatsapp:') 
        ? payload.to 
        : `whatsapp:${payload.to}`;

      if (!from || !from.startsWith('whatsapp:')) {
        throw new Error('Invalid WhatsApp sender. Must use whatsapp:+1234567890 format');
      }

      // Prepare media URLs if attachments are present
      const mediaUrl: string[] | undefined = payload.attachments
        ?.filter(att => att.url)
        .map(att => att.url!)
        .filter((url): url is string => !!url);

      // For WhatsApp, we can send rich media
      // Twilio WhatsApp supports images, videos, audio, documents
      const messageData: twilio.messages.MessageInstanceCreateOptions = {
        body: payload.body,
        from: from,
        to: to,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
      };

      // Add media if present (MMS via WhatsApp)
      if (mediaUrl && mediaUrl.length > 0) {
        messageData.mediaUrl = mediaUrl;
      }

      // Send WhatsApp message via Twilio
      const message = await this.client.messages.create(messageData);

      return {
        success: true,
        messageId: message.sid,
        status: this.mapTwilioStatus(message.status),
        channel: 'whatsapp',
        externalId: message.sid,
        metadata: {
          accountSid: message.accountSid,
          price: message.price || '',
          priceUnit: message.priceUnit || '',
          numMedia: message.numMedia || '0',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        messageId: '',
        status: 'failed',
        channel: 'whatsapp',
        error: `Twilio WhatsApp error: ${errorMessage}`,
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
      read: 'read',
      received: 'read',
    };

    return statusMap[twilioStatus.toLowerCase()] || 'pending';
  }
}

