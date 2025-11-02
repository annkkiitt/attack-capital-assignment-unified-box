import { z } from 'zod';

/**
 * Supported communication channels
 */
export const Channel = z.enum(['sms', 'whatsapp', 'email']);
export type Channel = z.infer<typeof Channel>;

/**
 * Message status types
 */
export const MessageStatus = z.enum(['pending', 'sent', 'delivered', 'failed', 'read']);
export type MessageStatus = z.infer<typeof MessageStatus>;

/**
 * Attachment schema for media files
 */
export const AttachmentSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  url: z.string().url().optional(),
  base64: z.string().optional(),
  size: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Unified message payload schema
 * Normalizes message data across all channels
 */
export const MessagePayloadSchema = z.object({
  // Channel identification
  channel: Channel,
  
  // Recipient information
  to: z.string().email().or(z.string().regex(/^\+?[1-9]\d{1,14}$/)), // Email or phone (E.164)
  
  // Sender information (optional, defaults to channel default)
  from: z.string().optional(),
  
  // Message content
  body: z.string().min(1, 'Message body cannot be empty'),
  subject: z.string().optional(), // For email
  
  // Rich content
  htmlBody: z.string().optional(), // For email/WhatsApp rich text
  attachments: z.array(AttachmentSchema).optional(),
  
  // Metadata
  metadata: z.record(z.string()).optional(), // Custom key-value pairs
  externalId: z.string().optional(), // For tracking external message IDs
  
  // Scheduling (optional)
  scheduledFor: z.date().optional(),
});

export type MessagePayload = z.infer<typeof MessagePayloadSchema>;

/**
 * Message response from channel provider
 */
export const MessageResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  status: MessageStatus,
  channel: Channel,
  externalId: z.string().optional(), // Provider's message ID
  error: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

/**
 * Base interface for all channel senders
 */
export interface ChannelSender {
  /**
   * Send a message through this channel
   * @param payload - The unified message payload
   * @returns Promise resolving to the message response
   */
  send(payload: MessagePayload): Promise<MessageResponse>;
  
  /**
   * Validate if the payload is compatible with this channel
   * @param payload - The message payload to validate
   * @returns Validation result with optional error message
   */
  validate(payload: MessagePayload): { valid: boolean; error?: string };
  
  /**
   * Get the channel type this sender handles
   */
  getChannel(): Channel;
}

