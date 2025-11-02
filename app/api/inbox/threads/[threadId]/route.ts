import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/inbox/threads/[threadId]
 * Fetch all messages in a specific thread
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> | { threadId: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = await Promise.resolve(params);
    const threadId = resolvedParams.threadId;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Fetch thread with all messages and contact info
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: 'asc' }, // Oldest first for timeline
          include: {
            attachments: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Mark thread as read
    await prisma.thread.update({
      where: { id: threadId },
      data: { unreadCount: 0 },
    });

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

