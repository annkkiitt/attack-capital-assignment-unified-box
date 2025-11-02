'use client';

import { useState } from 'react';
import { ThreadList } from '@/components/inbox/thread-list';
import { ThreadView } from '@/components/inbox/thread-view';
import { MessageComposer } from '@/components/inbox/message-composer';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

export default function InboxPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isNewMessage, setIsNewMessage] = useState(false);

  const handleNewMessage = () => {
    setIsNewMessage(true);
    setSelectedThreadId(null);
  };

  const handleCloseNewMessage = () => {
    setIsNewMessage(false);
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setIsNewMessage(false);
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar - Thread List */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">Inbox</h1>
            <div className='flex gap-2'>
              <Link href='/settings'>
              <Button variant='outline' size="icon" title='Twilio account settings'>
                <Settings className="w-3 h-3" />
              </Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Unified messages across all channels
          </p>
        </div>
        <ThreadList 
          onThreadSelect={handleThreadSelect}
          onNewMessage={handleNewMessage}
        />
      </div>

      {/* Main Content - Thread View or New Message */}
      <div className="flex-1 flex flex-col">
        {isNewMessage ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b p-4 bg-background">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleCloseNewMessage}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="font-semibold">New Message</h2>
                  <p className="text-sm text-muted-foreground">
                    Start a new conversation
                  </p>
                </div>
              </div>
            </div>
            {/* Message Composer */}
            <div className="flex-1 overflow-y-auto">
              <MessageComposer
                onSend={() => {
                  // After sending, close new message view and refresh threads
                  handleCloseNewMessage();
                  // The thread will be created automatically when the message is sent
                }}
                onClose={handleCloseNewMessage}
              />
            </div>
          </div>
        ) : selectedThreadId ? (
          <ThreadView
            threadId={selectedThreadId}
            onBack={() => setSelectedThreadId(null)}
            onReply={(threadId) => {
              // TODO: Open reply composer
              console.log('Reply to thread:', threadId);
            }}
            onForward={(messageId) => {
              // TODO: Open forward dialog
              console.log('Forward message:', messageId);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">No conversation selected</p>
              <p className="text-sm">Select a thread from the sidebar or start a new message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

