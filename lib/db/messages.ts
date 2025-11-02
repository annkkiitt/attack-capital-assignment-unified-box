import { prisma } from '@/lib/db';
import { Channel, MessageDirection, MessageStatus } from '@prisma/client';
import { findOrCreateContactByPhone, findOrCreateContactByEmail, findOrCreateThread } from './contacts';

/**
 * Store an inbound message in the database
 */
export async function storeInboundMessage(data: {
  channel: Channel;
  from: string;
  to: string;
  body?: string;
  subject?: string;
  htmlBody?: string;
  externalId: string;
  attachments?: Array<{ url: string; contentType: string }>;
}) {
  // Determine contact identifier based on channel
  const isEmail = data.channel === 'email';
  const contactIdentifier = isEmail ? data.from : data.from.replace('whatsapp:', '');

  // Find or create contact
  const contact = isEmail
    ? await findOrCreateContactByEmail(contactIdentifier, { autoMerge: true })
    : await findOrCreateContactByPhone(contactIdentifier, { autoMerge: true });

  // Find or create thread
  const thread = await findOrCreateThread(contact.id, data.channel);

  // Create message
  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      channel: data.channel,
      from: data.from,
      to: data.to,
      body: data.body,
      subject: data.subject,
      htmlBody: data.htmlBody,
      direction: 'inbound',
      status: 'delivered' as MessageStatus,
      externalId: data.externalId,
    },
    include: {
      thread: {
        include: {
          contact: true,
        },
      },
    },
  });

  // Create attachments if present
  if (data.attachments && data.attachments.length > 0) {
    await Promise.all(
      data.attachments.map((att) =>
        prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            filename: att.url.split('/').pop() || 'attachment',
            contentType: att.contentType,
            url: att.url,
          },
        })
      )
    );
  }

  // Update thread metadata
  await prisma.thread.update({
    where: { id: thread.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: {
        increment: 1,
      },
    },
  });

  // Create analytics event
  await prisma.analyticsEvent.create({
    data: {
      contactId: contact.id,
      messageId: message.id,
      eventType: 'response_received',
      channel: data.channel,
    },
  });

  return message;
}

/**
 * Store an outbound message in the database
 */
export async function storeOutboundMessage(data: {
  userId?: string;
  channel: Channel;
  to: string;
  from: string;
  body: string;
  subject?: string;
  htmlBody?: string;
  externalId: string;
  status: MessageStatus;
  attachments?: Array<{ url: string; contentType: string; filename: string }>;
}) {
  // Determine contact identifier based on channel
  const isEmail = data.channel === 'email';
  const contactIdentifier = isEmail ? data.to : data.to.replace('whatsapp:', '');

  // Find or create contact
  const contact = isEmail
    ? await findOrCreateContactByEmail(contactIdentifier, { autoMerge: true })
    : await findOrCreateContactByPhone(contactIdentifier, { autoMerge: true });

  // Find or create thread
  const thread = await findOrCreateThread(contact.id, data.channel);

  // Create message
  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      channel: data.channel,
      from: data.from,
      to: data.to,
      body: data.body,
      subject: data.subject,
      htmlBody: data.htmlBody,
      direction: 'outbound',
      status: data.status,
      externalId: data.externalId,
      userId: data.userId,
      sentAt: data.status === 'sent' ? new Date() : null,
    },
    include: {
      thread: {
        include: {
          contact: true,
        },
      },
    },
  });

  // Create attachments if present
  if (data.attachments && data.attachments.length > 0) {
    await Promise.all(
      data.attachments.map((att) =>
        prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            filename: att.filename,
            contentType: att.contentType,
            url: att.url,
          },
        })
      )
    );
  }

  // Update thread metadata
  await prisma.thread.update({
    where: { id: thread.id },
    data: {
      lastMessageAt: new Date(),
    },
  });

  // Create analytics event
  await prisma.analyticsEvent.create({
    data: {
      contactId: contact.id,
      messageId: message.id,
      userId: data.userId,
      eventType: 'message_sent',
      channel: data.channel,
    },
  });

  return message;
}

/**
 * Update message status (for status callbacks)
 */
export async function updateMessageStatus(
  externalId: string,
  status: MessageStatus,
  options?: {
    errorCode?: string;
    errorMessage?: string;
    readAt?: Date;
  }
) {
  // ✅ First find the message by externalId (with thread relation)
  const existingMessage = await prisma.message.findFirst({
    where: { externalId },
    include: {
      thread: {
        select: { contactId: true },
      },
    },
  });

  if (!existingMessage) {
    // ✅ Log warning but don't throw - message might not have been stored yet
    console.warn(`⚠️ Message with externalId ${externalId} not found. Status: ${status}`);
    console.warn('This can happen if the message was sent before storage was implemented.');
    return null;
  }

  // ✅ Then update using the id
  const message = await prisma.message.update({
    where: { id: existingMessage.id },
    data: {
      status,
      errorCode: options?.errorCode,
      errorMessage: options?.errorMessage,
      readAt: options?.readAt,
      sentAt: status === 'sent' ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  // Create analytics event (only for statuses that have corresponding event types)
  const eventType = mapStatusToEventType(status);
  if (existingMessage.thread?.contactId && eventType) {
    await prisma.analyticsEvent.create({
      data: {
        contactId: existingMessage.thread.contactId,
        eventType: eventType,
        metadata: {
          messageId: message.id,
          externalId: externalId,
          status,
        },
      },
    });
  }

  return message;
}

// ✅ Fix the mapping function to return valid AnalyticsEventType values
function mapStatusToEventType(status: MessageStatus): 'message_sent' | 'message_delivered' | 'message_read' | 'message_failed' | null {
  switch (status) {
    case 'sent':
      return 'message_sent';
    case 'delivered':
      return 'message_delivered';
    case 'read':
      return 'message_read';
    case 'failed':
      return 'message_failed';
    case 'pending':
      // Skip analytics for pending status (not a meaningful event)
      return null;
    default:
      return null;
  }
}

