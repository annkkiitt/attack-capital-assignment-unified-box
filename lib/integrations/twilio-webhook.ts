import twilio from 'twilio';
import { NextRequest } from 'next/server';

/**
 * Validates Twilio webhook request signature for security
 * @param request - The incoming Next.js request
 * @param body - The raw request body as string
 * @returns true if signature is valid, false otherwise
 */
export function validateTwilioWebhook(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-twilio-signature');
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!signature || !authToken) {
    return false;
  }

  try {
    // Twilio expects the full URL including protocol and host
    // For localhost, we need to construct it properly
    const url = new URL(request.url);
    const fullUrl = `${url.protocol}//${url.host}${url.pathname}${url.search}`;

    return twilio.validateRequest(
      authToken,
      signature,
      fullUrl,
      body
    );
  } catch (error) {
    console.error('Twilio webhook validation error:', error);
    return false;
  }
}

/**
 * Parse Twilio webhook form data
 * Twilio sends data as application/x-www-form-urlencoded
 */
export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string; // Number of media attachments
  MediaUrl0?: string;
  MediaUrl1?: string;
  MediaUrl2?: string;
  MediaUrl3?: string;
  MediaContentType0?: string;
  MediaContentType1?: string;
  MediaContentType2?: string;
  MediaContentType3?: string;
  MessageStatus?: string;
  SmsStatus?: string;
  MessageType?: string; // 'inbound' or 'status'
  ErrorCode?: string;
  ErrorMessage?: string;
}

/**
 * Determine if message is SMS or WhatsApp based on number format
 */
export function getChannelFromNumber(phoneNumber: string): 'sms' | 'whatsapp' {
  return phoneNumber.startsWith('whatsapp:') ? 'whatsapp' : 'sms';
}

/**
 * Extract media attachments from Twilio webhook payload
 */
export function extractMediaAttachments(payload: TwilioWebhookPayload): Array<{
  url: string;
  contentType: string;
}> {
  const numMedia = parseInt(payload.NumMedia || '0', 10);
  const attachments: Array<{ url: string; contentType: string }> = [];

  for (let i = 0; i < numMedia; i++) {
    const mediaUrl = payload[`MediaUrl${i}` as keyof TwilioWebhookPayload] as string;
    const contentType = payload[`MediaContentType${i}` as keyof TwilioWebhookPayload] as string;

    if (mediaUrl && contentType) {
      attachments.push({ url: mediaUrl, contentType });
    }
  }

  return attachments;
}

