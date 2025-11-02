import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/integrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, to, body: messageBody, subject } = body;

    if (!channel || !to || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, to, body' },
        { status: 400 }
      );
    }

    const payload = {
      channel: channel as 'sms' | 'whatsapp' | 'email',
      to,
      body: messageBody,
      subject: subject || undefined,
    };

    const response = await sendMessage(payload);

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