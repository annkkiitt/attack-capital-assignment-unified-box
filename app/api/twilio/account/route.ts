import { NextResponse } from 'next/server';
import { getTwilioAccountInfo, getTwilioPhoneNumbers, isTrialAccount, getWhatsAppSandboxInfo } from '@/lib/integrations/twilio-client';

/**
 * GET /api/twilio/account
 * Fetches Twilio account information, phone numbers, and trial status
 * Used for displaying account info in UI
 */
export async function GET() {
  try {
    const [accountInfo, phoneNumbers, isTrial, whatsappInfo] = await Promise.all([
      getTwilioAccountInfo(),
      getTwilioPhoneNumbers(),
      isTrialAccount(),
      getWhatsAppSandboxInfo(),
    ]);

    return NextResponse.json({
      account: accountInfo,
      phoneNumbers,
      isTrial,
      whatsappSandbox: whatsappInfo,
      restrictions: isTrial ? {
        canOnlySendToVerified: true,
        messagePrefix: 'Sent from a Twilio trial account',
        upgradeRequired: true,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching Twilio account info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twilio account information' },
      { status: 500 }
    );
  }
}

