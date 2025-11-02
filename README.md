# Unified Inbox

A Next.js application for managing multi-channel messaging (SMS, WhatsApp, Email) with a unified inbox interface.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/annkkiitt/attack-capital-assignment-unified-box.git
   ```

2. **Navigate to the project directory**
   ```bash
   cd attack-capital-assignment-unified-box
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   
   Check `.env.example` and create a `.env` file with your configuration:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `DIRECT_URL`: Same as DATABASE_URL (required for migrations)
   - `BETTER_AUTH_SECRET`: Generate with `npx @better-auth/cli secret` or use a secure random string
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number (e.g., `+1234567890`)
   - `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number (e.g., `whatsapp:+14155238886`)
   - `RESEND_API_KEY`: Your Resend API key (for email)
   - `RESEND_FROM_EMAIL`: Your verified Resend sender email

5. **Run Prisma migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Twilio Webhook Setup

For local development, use **ngrok** to expose your local server and receive webhooks:

1. Install ngrok: https://ngrok.com/download

2. Start your development server:
   ```bash
   npm run dev
   ```

3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```

4. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)

5. Update your Twilio account webhook URLs:
   - **SMS**: Go to your Twilio phone number settings and set the webhook URL to `https://abc123.ngrok.io/api/webhooks/twilio`
   - **WhatsApp**: Go to Twilio WhatsApp Sandbox and set "When a message comes in" to `https://abc123.ngrok.io/api/webhooks/twilio`

## Additional Resources

- See [ARCHITECTURE.md](docs/ARCHITECTURE_SIMPLIFIED.md) for detailed system architecture
- See [WEBHOOK_SETUP.md](lib/integrations/WEBHOOK_SETUP.md) for more webhook configuration details
