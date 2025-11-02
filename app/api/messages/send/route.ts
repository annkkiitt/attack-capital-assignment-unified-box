import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/integrations';
import { storeOutboundMessage } from '@/lib/db/messages';
import { auth } from '@/lib/auth';
import { MessageStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, to, body: messageBody, subject, from, threadId } = body;

    if (!channel || !to || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, to, body' },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    const payload = {
      channel: channel as 'sms' | 'whatsapp' | 'email',
      to,
      body: messageBody,
      subject: subject || undefined,
      from: from || undefined,
    };

    const response = await sendMessage(payload);

    if (response.success && response.externalId) {
      try {
        await storeOutboundMessage({
          userId,
          channel: response.channel as 'sms' | 'whatsapp' | 'email',
          to: payload.to,
          from: payload.from || '',
          body: payload.body,
          subject: payload.subject,
          externalId: response.externalId,
          status: response.status as MessageStatus,
        });
      } catch (dbError) {
        console.error('Error storing message:', dbError);
      }
    }

    return NextResponse.json({
      success: response.success,
      messageId: response.messageId,
      status: response.status,
      channel: response.channel,
      error: response.error,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}