import { Channel, MessagePayload, ChannelSender } from './types';
import { TwilioSMSSender } from './twilio-sms';
import { TwilioWhatsAppSender } from './twilio-whatsapp';
import { ResendEmailSender } from './resend-email';

/**
 * Factory function to create a channel-specific sender
 * @param channel - The channel type (sms, whatsapp, email)
 * @returns A ChannelSender instance for the specified channel
 * @throws Error if the channel is not supported
 * 
 * @example
 * ```ts
 * const sender = createSender('sms');
 * const response = await sender.send({
 *   channel: 'sms',
 *   to: '+1234567890',
 *   body: 'Hello!'
 * });
 * ```
 */
export function createSender(channel: Channel): ChannelSender {
  switch (channel) {
    case 'sms':
      return new TwilioSMSSender();
    case 'whatsapp':
      return new TwilioWhatsAppSender();
    case 'email':
      return new ResendEmailSender();
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}

/**
 * Send a message through the specified channel
 * Convenience function that creates a sender and sends the message
 * 
 * @param payload - The unified message payload
 * @returns Promise resolving to the message response
 */
export async function sendMessage(payload: MessagePayload): Promise<import('./types').MessageResponse> {
  const sender = createSender(payload.channel);
  return sender.send(payload);
}

/**
 * Export all types for convenience
 */
export * from './types';

