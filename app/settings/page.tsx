import { TwilioSettings } from '@/components/settings/twilio-settings';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth-server';
import { ArrowLeft, ArrowRightSquare } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getSession();
  const isAuthenticated = !!session?.user;
  if (!isAuthenticated) {
    redirect('/login');
  }
  return (
    <div className="container max-w-6xl mx-auto p-8">
      <div className="mb-8">
          <Link href='/inbox' className='flex mb-4 flex-row bg-muted rounded-md p-2 w-fit items-center gap-2'><ArrowLeft/> Back to Inbox</Link>

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

