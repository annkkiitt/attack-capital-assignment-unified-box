import { TwilioSettings } from '@/components/settings/twilio-settings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your integrations and account settings
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Twilio Integration</h2>
          <TwilioSettings />
        </section>
      </div>
    </div>
  );
}

