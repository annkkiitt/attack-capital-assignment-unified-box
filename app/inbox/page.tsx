'use client';

import { useState } from 'react';
import { ThreadList } from '@/components/inbox/thread-list';
import { ThreadView } from '@/components/inbox/thread-view';

export default function InboxPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  return (
    <div className="h-screen flex">
      {/* Sidebar - Thread List */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified messages across all channels
          </p>
        </div>
        <ThreadList onThreadSelect={setSelectedThreadId} />
      </div>

      {/* Main Content - Thread View */}
      <div className="flex-1 flex flex-col">
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
      </div>
    </div>
  );
}

