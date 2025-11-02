import twilio from 'twilio';

/**
 * Shared Twilio client instance
 * Singleton pattern to avoid creating multiple clients
 */
let twilioClient: twilio.Twilio | null = null;

/**
 * Get or create Twilio client instance
 */
export function getTwilioClient(): twilio.Twilio {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

/**
 * Get Twilio account information
 */
export interface TwilioAccountInfo {
  accountSid: string;
  friendlyName: string;
  status: string;
  type: string;
}

/**
 * Get Twilio phone numbers
 */
export interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    sms: boolean;
    mms: boolean;
    voice: boolean;
  };
}

/**
 * Fetch Twilio account information
 */
export async function getTwilioAccountInfo(): Promise<TwilioAccountInfo | null> {
  try {
    const client = getTwilioClient();
    const account = await client.api.accounts(client.accountSid).fetch();
    
    return {
      accountSid: account.sid,
      friendlyName: account.friendlyName || '',
      status: account.status || '',
      type: account.type || '',
    };
  } catch (error) {
    console.error('Error fetching Twilio account info:', error);
    return null;
  }
}

/**
 * Fetch all Twilio phone numbers
 */
export async function getTwilioPhoneNumbers(): Promise<TwilioPhoneNumber[]> {
  try {
    const client = getTwilioClient();
    const incomingNumbers = await client.incomingPhoneNumbers.list();
    
    return incomingNumbers.map(num => ({
      sid: num.sid,
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName || num.phoneNumber,
      capabilities: {
        sms: num.capabilities?.sms || false,
        mms: num.capabilities?.mms || false,
        voice: num.capabilities?.voice || false,
      },
    }));
  } catch (error) {
    console.error('Error fetching Twilio phone numbers:', error);
    return [];
  }
}

/**
 * Check if account is a trial account
 * Trial accounts have restrictions: can only send to verified numbers
 */
export async function isTrialAccount(): Promise<boolean> {
  try {
    const accountInfo = await getTwilioAccountInfo();
    return accountInfo?.type === 'Trial' || accountInfo?.status === 'trial';
  } catch {
    return false;
  }
}

/**
 * Get WhatsApp sandbox join code (if using sandbox)
 */
export async function getWhatsAppSandboxInfo(): Promise<{
  sandboxNumber: string;
  joinCode: string;
} | null> {
  try {
    // WhatsApp sandbox info is typically configured in Twilio Console
    // For now, return from environment or default
    const sandboxNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    // Join code is usually displayed in Twilio Console under Messaging → Try it out
    // This would ideally be fetched from Twilio API, but it's not directly available
    // Users need to check Twilio Console for the join code
    
    return {
      sandboxNumber,
      joinCode: 'Check Twilio Console → Messaging → Try it out → Send a WhatsApp message',
    };
  } catch {
    return null;
  }
}

