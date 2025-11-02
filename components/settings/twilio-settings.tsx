'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info, Phone, MessageSquare, Loader2, ArrowRightSquare } from 'lucide-react';
import Link from 'next/link';

interface TwilioAccountInfo {
  account: {
    accountSid: string;
    friendlyName: string;
    status: string;
    type: string;
  } | null;
  phoneNumbers: Array<{
    sid: string;
    phoneNumber: string;
    friendlyName: string;
    capabilities: {
      sms: boolean;
      mms: boolean;
      voice: boolean;
    };
  }>;
  isTrial: boolean;
  whatsappSandbox: {
    sandboxNumber: string;
    joinCode: string;
  } | null;
  restrictions: {
    canOnlySendToVerified: boolean;
    messagePrefix: string;
    upgradeRequired: boolean;
  } | null;
}

export function TwilioSettings() {
  const [data, setData] = useState<TwilioAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTwilioInfo();
  }, []);

  const fetchTwilioInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/twilio/account');
      if (!response.ok) {
        throw new Error('Failed to fetch Twilio account info');
      }
      const info = await response.json();
      setData(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading Twilio account information...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading Twilio information: {error}</span>
          </div>
          <Button onClick={fetchTwilioInfo} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4">

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Twilio Account
          </CardTitle>
          <CardDescription>Your Twilio account configuration and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Status</span>
            <Badge variant={data.isTrial ? 'secondary' : 'default'}>
              {data.isTrial ? 'Trial Account' : data.account?.status || 'Active'}
            </Badge>
          </div>
          {data.account && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Name</span>
                <span className="text-sm font-medium">{data.account.friendlyName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account SID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {data.account.accountSid}
                </code>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Trial Restrictions */}
      {data.isTrial && data.restrictions && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Trial Account Restrictions
            </CardTitle>
            <CardDescription>Trial accounts have the following limitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>You can only send messages to <strong>verified phone numbers</strong></span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>All messages will include the prefix: <code className="bg-muted px-1 rounded">&quot;{data.restrictions.messagePrefix}&quot;</code></span>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://www.twilio.com/console', '_blank')}
              >
                Upgrade Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Numbers
          </CardTitle>
          <CardDescription>Your active Twilio phone numbers for SMS</CardDescription>
        </CardHeader>
        <CardContent>
          {data.phoneNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No phone numbers found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.open('https://www.twilio.com/console/phone-numbers/incoming', '_blank')}
              >
                Buy a Number
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.phoneNumbers.map((number) => (
                <div
                  key={number.sid}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{number.phoneNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        SMS {number.capabilities.mms && '+ MMS'}
                      </Badge>
                    </div>
                    {number.friendlyName !== number.phoneNumber && (
                      <p className="text-xs text-muted-foreground mt-1">{number.friendlyName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {data.phoneNumbers.length > 0 && (
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.twilio.com/console/phone-numbers/incoming', '_blank')}
            >
              Manage Numbers
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* WhatsApp Sandbox */}
      {data.whatsappSandbox && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Sandbox
            </CardTitle>
            <CardDescription>Configure WhatsApp messaging via Twilio Sandbox</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sandbox Number</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {data.whatsappSandbox.sandboxNumber}
              </code>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">To join the sandbox:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Open WhatsApp on your phone</li>
                <li>Send a message to {data.whatsappSandbox.sandboxNumber.replace('whatsapp:', '')}</li>
                <li>Send the join code shown in Twilio Console</li>
              </ol>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.twilio.com/console/sms/whatsapp/learn', '_blank')}
              >
                View Join Code in Console
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

