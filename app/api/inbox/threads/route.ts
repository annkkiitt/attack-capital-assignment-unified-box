import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/inbox/threads
 * Fetch threads for the inbox view
 * Supports filtering and searching
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // open, closed, archived
    const channel = searchParams.get('channel'); // sms, whatsapp, email
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (channel) {
      where.channel = channel;
    }
    
    if (unreadOnly) {
      where.unreadCount = { gt: 0 };
    }

    // Search by contact name, phone, or email
    if (search) {
      where.contact = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Fetch threads with contact info and latest message
    const threads = await prisma.thread.findMany({
      where,
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Latest message only
          include: {
            attachments: true,
          },
        },
      },
      orderBy: [
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.thread.count({ where });

    return NextResponse.json({
      threads,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

