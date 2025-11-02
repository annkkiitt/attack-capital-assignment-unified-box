import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioWebhook, TwilioWebhookPayload, getChannelFromNumber, extractMediaAttachments } from '@/lib/integrations/twilio-webhook';
import { storeInboundMessage, updateMessageStatus } from '@/lib/db/messages';
import { MessageStatus } from '@prisma/client';

/**
 * Twilio Webhook Handler
 * Handles inbound SMS/WhatsApp messages and status callbacks
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/twilio
 * Configure in Twilio Console → Phone Numbers → Manage → Active Numbers → Webhook
 * 
 * For local testing with ngrok:
 * ngrok http 3000
 * Use: https://your-ngrok-url.ngrok.io/api/webhooks/twilio
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const body = await request.text();
    
    // Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = new URLSearchParams(body);
    const payload: TwilioWebhookPayload = Object.fromEntries(formData) as unknown as TwilioWebhookPayload;

    // Validate webhook signature (security)
    // Note: For local testing, you might want to skip validation
    // In production, always validate!
    const isValid = process.env.NODE_ENV === 'production' 
      ? validateTwilioWebhook(request, body)
      : true; // Skip validation in development for easier testing

    if (!isValid) {
      console.error('Invalid Twilio webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Determine if this is an inbound message or status callback
    const isStatusCallback = payload.MessageStatus || payload.SmsStatus;
    
    if (isStatusCallback) {
      // Handle status callback (delivery receipts)
      await handleStatusCallback(payload);
      return NextResponse.json({ received: true });
    } else {
      // Handle inbound message
      await handleInboundMessage(payload);
      return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle inbound SMS/WhatsApp messages
 */
async function handleInboundMessage(payload: TwilioWebhookPayload) {
  try {
    const channel = getChannelFromNumber(payload.From);
    const fromNumber = payload.From.replace('whatsapp:', '');
    const toNumber = payload.To.replace('whatsapp:', '');
    
    // Extract media attachments
    const mediaAttachments = extractMediaAttachments(payload);

    console.log('Inbound message received:', {
      messageSid: payload.MessageSid,
      channel,
      from: fromNumber,
      to: toNumber,
      body: payload.Body,
      numMedia: payload.NumMedia,
    });

    // Store message in database
    const message = await storeInboundMessage({
      channel,
      from: payload.From,
      to: payload.To,
      body: payload.Body || undefined,
      externalId: payload.MessageSid,
      attachments: mediaAttachments,
    });

    console.log('Inbound message stored:', {
      messageId: message.id,
      threadId: message.threadId,
      contactId: message.thread.contact.id,
    });
  } catch (error) {
    console.error('Error handling inbound message:', error);
    throw error;
  }
}

/**
 * Handle status callbacks (delivery receipts)
 */
async function handleStatusCallback(payload: TwilioWebhookPayload) {
  try {
    const status = payload.MessageStatus || payload.SmsStatus || '';
    const messageSid = payload.MessageSid;

    console.log('Status callback received:', {
      messageSid,
      status,
      errorCode: payload.ErrorCode,
      errorMessage: payload.ErrorMessage,
    });

    // Update message status in database
    const mappedStatus = mapTwilioStatusToMessageStatus(status);
    await updateMessageStatus(messageSid, mappedStatus, {
      errorCode: payload.ErrorCode,
      errorMessage: payload.ErrorMessage,
      readAt: mappedStatus === 'read' ? new Date() : undefined,
    });

    console.log('Status update processed:', { messageSid, status: mappedStatus });
  } catch (error) {
    console.error('Error handling status callback:', error);
    throw error;
  }
}

/**
 * Map Twilio status to our unified message status
 */
function mapTwilioStatusToMessageStatus(twilioStatus: string): 'pending' | 'sent' | 'delivered' | 'failed' | 'read' {
  const statusMap: Record<string, 'pending' | 'sent' | 'delivered' | 'failed' | 'read'> = {
    queued: 'pending',
    sending: 'pending',
    sent: 'sent',
    delivered: 'delivered',
    undelivered: 'failed',
    failed: 'failed',
    read: 'read',
    received: 'delivered',
  };

  return statusMap[twilioStatus.toLowerCase()] || 'pending';
}

// Twilio webhooks can also use GET for initial validation
export async function GET(request: NextRequest) {
  // Twilio sometimes sends GET requests for webhook validation
  return NextResponse.json({ message: 'Twilio webhook endpoint is active' });
}

