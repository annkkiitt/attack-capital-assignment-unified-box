# Integrations Module

This module implements a factory pattern for unified multi-channel communication. It provides a consistent interface for sending messages across different communication channels (SMS, WhatsApp, Email).

## Architecture

The module uses a factory pattern with channel-specific implementations that all conform to the `ChannelSender` interface.

### Core Components

- **Types** (`types.ts`): Unified Zod schemas and TypeScript types for message payloads and responses
- **Factory** (`index.ts`): `createSender()` function that instantiates the appropriate channel sender
- **Channel Implementations**:
  - `twilio-sms.ts`: SMS messaging via Twilio
  - `twilio-whatsapp.ts`: WhatsApp messaging via Twilio Sandbox
  - `resend-email.ts`: Email messaging via Resend API

## Usage

### Basic Usage

```typescript
import { createSender } from '@/lib/integrations';

// Create a sender for SMS
const smsSender = createSender('sms');

// Send a message
const response = await smsSender.send({
  channel: 'sms',
  to: '+1234567890',
  body: 'Hello from unified inbox!',
});
```

### Convenience Function

```typescript
import { sendMessage } from '@/lib/integrations';

// Send directly without creating sender
const response = await sendMessage({
  channel: 'whatsapp',
  to: '+1234567890',
  body: 'WhatsApp message',
});
```

### Channel-Specific Examples

#### SMS Example

```typescript
import { createSender } from '@/lib/integrations';

const sender = createSender('sms');

const response = await sender.send({
  channel: 'sms',
  to: '+1234567890',
  from: '+0987654321', // Optional, defaults to TWILIO_PHONE_NUMBER
  body: 'Your verification code is 123456',
  metadata: {
    campaign: 'verification',
    userId: '123',
  },
});

if (response.success) {
  console.log(`Message sent! ID: ${response.messageId}`);
}
```

#### WhatsApp Example

```typescript
const sender = createSender('whatsapp');

const response = await sender.send({
  channel: 'whatsapp',
  to: '+1234567890', // Will be formatted as whatsapp:+1234567890
  body: 'Welcome to our service! 🎉',
  attachments: [
    {
      filename: 'welcome.pdf',
      url: 'https://example.com/welcome.pdf',
      contentType: 'application/pdf',
    },
  ],
});
```

#### Email Example

```typescript
const sender = createSender('email');

const response = await sender.send({
  channel: 'email',
  to: 'customer@example.com',
  subject: 'Welcome to Unified Inbox',
  body: 'Thank you for signing up!',
  htmlBody: '<h1>Welcome!</h1><p>Thank you for signing up.</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      base64: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9...', // Base64 encoded file
      contentType: 'application/pdf',
    },
  ],
});
```

## Message Payload Schema

All channels accept a unified `MessagePayload`:

```typescript
{
  channel: 'sms' | 'whatsapp' | 'email',
  to: string, // Email or phone number (E.164 format)
  from?: string, // Optional, uses channel default if not provided
  body: string, // Required text content
  subject?: string, // Optional, primarily for email
  htmlBody?: string, // Optional, for email/WhatsApp rich content
  attachments?: Array<{
    filename: string,
    contentType: string,
    url?: string,
    base64?: string,
    size?: number,
  }>,
  metadata?: Record<string, string>, // Custom key-value pairs
  externalId?: string, // For tracking external message IDs
  scheduledFor?: Date, // Optional scheduling (not implemented in base senders)
}
```

## Response Format

All channel senders return a unified `MessageResponse`:

```typescript
{
  success: boolean,
  messageId: string,
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read',
  channel: 'sms' | 'whatsapp' | 'email',
  externalId?: string, // Provider's message ID
  error?: string,
  metadata?: Record<string, string>,
}
```

## Validation

Each channel sender validates the payload before sending:

```typescript
const sender = createSender('sms');
const validation = sender.validate(payload);

if (!validation.valid) {
  console.error(validation.error);
}
```

## Environment Variables

### Twilio (SMS & WhatsApp)

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox number
TWILIO_STATUS_CALLBACK_URL=https://yourapp.com/api/webhooks/twilio  # Optional
```

### Resend (Email)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Must be verified domain
```

## Error Handling

All senders catch and return errors in a consistent format:

```typescript
const response = await sender.send(payload);

if (!response.success) {
  // Handle error
  console.error(response.error);
  // response.status will be 'failed'
}
```

## Extending the Module

To add a new channel:

1. Create a new file (e.g., `lib/integrations/new-channel.ts`)
2. Implement the `ChannelSender` interface
3. Add the channel to the `Channel` enum in `types.ts`
4. Update the `createSender()` factory function in `index.ts`

Example:

```typescript
// lib/integrations/new-channel.ts
import { ChannelSender, MessagePayload, MessageResponse } from './types';

export class NewChannelSender implements ChannelSender {
  getChannel(): Channel {
    return 'newchannel';
  }

  validate(payload: MessagePayload): { valid: boolean; error?: string } {
    // Validation logic
  }

  async send(payload: MessagePayload): Promise<MessageResponse> {
    // Send logic
  }
}
```

## Testing

Each sender can be tested independently:

```typescript
import { TwilioSMSSender } from '@/lib/integrations/twilio-sms';

const sender = new TwilioSMSSender();
const isValid = sender.validate(testPayload);
const response = await sender.send(testPayload);
```

## Notes

- **Trial Mode**: Twilio trial accounts can only send to verified numbers. Display trial restrictions in UI.
- **WhatsApp Sandbox**: Users must join sandbox by sending a join code to the sandbox number.
- **Email Verification**: Resend requires verified sender domains for production use.
- **Rate Limits**: Each provider has rate limits; implement queueing for high-volume sends.

