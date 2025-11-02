# Twilio Webhook Setup Guide

This guide explains how to set up and test Twilio webhooks for receiving inbound SMS/WhatsApp messages.

## Webhook Endpoint

The webhook endpoint is available at:
```
POST /api/webhooks/twilio
```

## Local Development Setup

### Option 1: Using ngrok (Recommended)

1. **Install ngrok**: https://ngrok.com/download

2. **Start your Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Start ngrok in another terminal**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok (e.g., `https://abc123.ngrok.io`)

5. **Configure webhook in Twilio Console**:
   - Go to: https://www.twilio.com/console/phone-numbers/incoming
   - Click on your phone number
   - Under "Messaging", set Webhook URL to: `https://abc123.ngrok.io/api/webhooks/twilio`
   - Save configuration

6. **For WhatsApp webhooks**:
   - Go to: https://www.twilio.com/console/sms/whatsapp/sandbox
   - Set "When a message comes in" to: `https://abc123.ngrok.io/api/webhooks/twilio`

### Option 2: Using Twilio CLI (Alternative)

```bash
# Install Twilio CLI
npm install -g twilio-cli

# Login
twilio login

# Start local webhook proxy
twilio phone-numbers:update +1234567890 --sms-url http://localhost:3000/api/webhooks/twilio
```

## Production Setup

1. **Deploy your Next.js app** (Vercel, Railway, etc.)

2. **Get your production URL** (e.g., `https://yourdomain.com`)

3. **Configure webhook in Twilio Console**:
   - Webhook URL: `https://yourdomain.com/api/webhooks/twilio`
   - Method: POST
   - Save configuration

4. **Update environment variable** (optional, for status callbacks):
   ```env
   TWILIO_STATUS_CALLBACK_URL="https://yourdomain.com/api/webhooks/twilio"
   ```

## Webhook Security

### Signature Validation

The webhook handler validates Twilio signatures to ensure requests are authentic. 

**In development**: Signature validation is disabled for easier testing
**In production**: Signature validation is automatically enabled

### Manual Testing (Skip Validation)

To test without signature validation locally, the webhook currently skips validation in development mode. 

For production, always ensure:
1. Your `TWILIO_AUTH_TOKEN` is set correctly
2. The webhook URL is HTTPS
3. Signature validation is enabled

## Testing the Webhook

### Test Inbound SMS

1. Send an SMS to your Twilio phone number
2. Check your server logs for the webhook payload
3. The message should be logged with details

### Test Status Callback

1. Send an outbound SMS via the API
2. Twilio will send status updates (sent, delivered, failed) to the webhook
3. Check logs to see status callbacks

### Test with curl

```bash
# Simulate an inbound SMS webhook (development only)
curl -X POST http://localhost:3000/api/webhooks/twilio \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM123&AccountSid=AC123&From=%2B1234567890&To=%2B0987654321&Body=Test+message"
```

## Webhook Payload Format

### Inbound Message

```json
{
  "MessageSid": "SMxxxxxxxxxxxxx",
  "AccountSid": "ACxxxxxxxxxxxxx",
  "From": "+1234567890",
  "To": "+0987654321",
  "Body": "Hello from Twilio!",
  "NumMedia": "0"
}
```

### With Media (MMS)

```json
{
  "MessageSid": "SMxxxxxxxxxxxxx",
  "From": "+1234567890",
  "Body": "Check out this image",
  "NumMedia": "1",
  "MediaUrl0": "https://api.twilio.com/.../Media/ME...",
  "MediaContentType0": "image/jpeg"
}
```

### Status Callback

```json
{
  "MessageSid": "SMxxxxxxxxxxxxx",
  "MessageStatus": "delivered",
  "SmsStatus": "delivered"
}
```

## Troubleshooting

### Webhook Not Receiving Requests

1. **Check ngrok is running** (for local dev)
2. **Verify webhook URL in Twilio Console** matches your endpoint
3. **Check server logs** for incoming requests
4. **Test with curl** to verify endpoint is accessible

### Signature Validation Fails

1. Ensure `TWILIO_AUTH_TOKEN` is correct
2. Check webhook URL matches exactly what's in Twilio Console
3. Verify request body is raw (not parsed)

### Messages Not Being Stored

Currently, inbound messages are logged to console. To store them:
1. Ensure Prisma schema has `Message` and `Contact` models
2. Uncomment the database storage code in `app/api/webhooks/twilio/route.ts`
3. Run database migrations

## Next Steps

1. **Set up database models** for Message and Contact
2. **Implement message storage** in webhook handler
3. **Add real-time updates** for new messages
4. **Create inbox UI** to display messages

