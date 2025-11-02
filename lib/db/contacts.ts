import { prisma } from '@/lib/db';
import { Channel } from '@prisma/client';
// TypeScript may need IDE restart to recognize Prisma models after generation

/**
 * Find or create a contact by phone number
 * Includes auto-merge logic for duplicates
 */
export async function findOrCreateContactByPhone(
  phone: string,
  options?: {
    name?: string;
    email?: string;
    autoMerge?: boolean;
  }
) {
  // Normalize phone number (E.164 format)
  const normalizedPhone = normalizePhone(phone);

  // Try to find existing contact by phone
  let contact = await prisma.contact.findFirst({
    where: {
      phone: normalizedPhone,
    },
  });

  // If not found and auto-merge is enabled, try fuzzy matching
  if (!contact && options?.autoMerge) {
    contact = await findContactByFuzzyMatch(normalizedPhone, options.email);
  }

  // Create new contact if not found
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        phone: normalizedPhone,
        name: options?.name || normalizedPhone,
        email: options?.email,
        status: 'lead',
      },
    });
  } else {
    // Update existing contact if new info provided
    if (options?.name || options?.email) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: options?.name || contact.name,
          email: options?.email || contact.email,
          lastContactedAt: new Date(),
        },
      });
    } else {
      // Just update lastContactedAt
      await prisma.contact.update({
        where: { id: contact.id },
        data: { lastContactedAt: new Date() },
      });
    }
  }

  return contact;
}

/**
 * Find or create a contact by email
 */
export async function findOrCreateContactByEmail(
  email: string,
  options?: {
    name?: string;
    phone?: string;
    autoMerge?: boolean;
  }
) {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find existing contact by email
  let contact = await prisma.contact.findFirst({
    where: {
      email: normalizedEmail,
    },
  });

  // If not found and auto-merge is enabled, try fuzzy matching
  if (!contact && options?.autoMerge && options.phone) {
    contact = await findContactByFuzzyMatch(options.phone, normalizedEmail);
  }

  // Create new contact if not found
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        email: normalizedEmail,
        phone: options?.phone ? normalizePhone(options.phone) : null,
        name: options?.name || normalizedEmail,
        status: 'lead',
      },
    });
  } else {
    // Update existing contact
    const updateData: any = { lastContactedAt: new Date() };
    if (options?.name) updateData.name = options.name;
    if (options?.phone && !contact.phone) {
      updateData.phone = normalizePhone(options.phone);
    }

    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: updateData,
    });
  }

  return contact;
}

/**
 * Fuzzy matching to find potential duplicate contacts
 * Matches by similar phone numbers or matching email
 */
async function findContactByFuzzyMatch(phone?: string, email?: string) {
  if (!phone && !email) return null;

  // Try to find by similar phone (last 10 digits)
  if (phone) {
    const lastDigits = phone.slice(-10);
    const contacts = await prisma.contact.findMany({
      where: {
        phone: {
          contains: lastDigits,
        },
      },
    });

    if (contacts.length === 1) {
      return contacts[0];
    }
  }

  // Try to find by email
  if (email) {
    const contact = await prisma.contact.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
    if (contact) return contact;
  }

  return null;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If doesn't start with +, try to infer country code
  if (!normalized.startsWith('+')) {
    // Assume US number if 10 digits
    if (normalized.length === 10) {
      normalized = '+1' + normalized;
    } else {
      // Otherwise, add + prefix
      normalized = '+' + normalized;
    }
  }

  return normalized;
}

/**
 * Auto-merge duplicate contacts
 * Merges source contact into target contact
 */
export async function mergeContacts(targetId: string, sourceId: string) {
  const [target, source] = await Promise.all([
    prisma.contact.findUnique({ where: { id: targetId } }),
    prisma.contact.findUnique({ where: { id: sourceId } }),
  ]);

  if (!target || !source) {
    throw new Error('Contact not found');
  }

  // Update all relations to point to target contact
  await prisma.$transaction([
    // Update threads
    prisma.thread.updateMany({
      where: { contactId: sourceId },
      data: { contactId: targetId },
    }),
    // Update notes
    prisma.note.updateMany({
      where: { contactId: sourceId },
      data: { contactId: targetId },
    }),
    // Update scheduled messages
    prisma.scheduledMessage.updateMany({
      where: { contactId: sourceId },
      data: { contactId: targetId },
    }),
    // Update analytics events
    prisma.analyticsEvent.updateMany({
      where: { contactId: sourceId },
      data: { contactId: targetId },
    }),
    // Update target contact with merged info
    prisma.contact.update({
      where: { id: targetId },
      data: {
        // Merge contact info (keep non-null values)
        name: target.name || source.name,
        phone: target.phone || source.phone,
        email: target.email || source.email,
        twitterHandle: target.twitterHandle || source.twitterHandle,
        facebookHandle: target.facebookHandle || source.facebookHandle,
        // Track merged contact
        mergedFromIds: [...(target.mergedFromIds || []), sourceId],
      },
    }),
    // Delete source contact
    prisma.contact.delete({ where: { id: sourceId } }),
  ]);

  return target;
}

/**
 * Find or create a thread for a contact and channel
 */
export async function findOrCreateThread(
  contactId: string,
  channel: Channel
) {
  // Try to find existing thread
  let thread = await prisma.thread.findFirst({
    where: {
      contactId,
      channel,
      status: {
        in: ['open', 'closed'], // Don't include archived threads
      },
    },
  });

  // Create new thread if not found
  if (!thread) {
    thread = await prisma.thread.create({
      data: {
        contactId,
        channel,
        status: 'open',
        unreadCount: 0,
      },
    });
  }

  return thread;
}

