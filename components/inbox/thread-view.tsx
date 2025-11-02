'use client';

import { useEffect, useState } from 'react';
import { MessageItem } from './message-item';
import { Button } from '@/components/ui/button';
import { Reply, Forward, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import { MessageComposer } from './message-composer';

interface Thread {
  id: string;
  channel: 'sms' | 'whatsapp' | 'email';
  status: string;
  contact: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  messages: Array<{
    id: string;
    body: string | null;
    subject: string | null;
    direction: 'inbound' | 'outbound';
    status: string;
    from: string;
    fromName: string | null;
    htmlBody: string | null;
    errorMessage: string | null;
    createdAt: string;
    attachments: Array<{
      id: string;
      filename: string;
      contentType: string;
      url: string | null;
      size: number | null;
    }>;
    user?: {
      id: string;
      name: string;
      image: string | null;
    } | null;
  }>;
}

interface ThreadViewProps {
  threadId: string | null;
  onBack?: () => void;
  onReply?: (threadId: string) => void;
  onForward?: (messageId: string) => void;
}

const channelIcons = {
  sms: Phone,
  whatsapp: MessageSquare,
  email: Mail,
};

const channelColors = {
  sms: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

export function ThreadView({ threadId, onBack, onReply, onForward }: ThreadViewProps) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setThread(null);
      return;
    }

    fetchThread(threadId);
    
    // Poll every 5 seconds to get new messages
    // const interval = setInterval(() => {
    //   fetchThread(threadId);
    // }, 5000);
    
    // return () => clearInterval(interval);
  }, [threadId]);

  const fetchThread = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inbox/threads/${id}`);
      if (!response.ok) throw new Error('Failed to fetch thread');
      
      const data = await response.json();
      setThread(data);
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!threadId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a thread to view messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>Thread not found</p>
      </div>
    );
  }

  const ChannelIcon = channelIcons[thread.channel];
  const contactDisplay = thread.contact.name || thread.contact.phone || thread.contact.email || 'Unknown';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className={`p-2 rounded-lg ${channelColors[thread.channel]}`}>
              <ChannelIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold">{contactDisplay}</h2>
              <p className="text-sm text-muted-foreground">
                {thread.contact.phone || thread.contact.email || ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{thread.channel.toUpperCase()}</Badge>
            {thread.status === 'open' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply?.(thread.id)}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {thread.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages in this thread</p>
          </div>
        ) : (
          thread.messages.map((message) => (
            <div
              key={message.id}
              className="group relative"
              onMouseEnter={() => setSelectedMessageId(message.id)}
              onMouseLeave={() => setSelectedMessageId(null)}
            >
              <MessageItem 
                message={message} 
                contactName={contactDisplay}
              />
              
              {/* Message Actions (Reply/Forward) - Show on hover */}
              {selectedMessageId === message.id && (
                <div className={`absolute top-2 ${
                  message.direction === 'outbound' ? 'left-2' : 'right-2'
                } flex gap-1 bg-background border rounded-lg p-1 shadow-lg z-10`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onReply?.(thread.id)}
                    title="Reply"
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onForward?.(message.id)}
                    title="Forward"
                  >
                    <Forward className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
            {/* Message Composer */}
            <MessageComposer
        threadId={threadId || undefined}
        contactId={thread?.contact.id}
        defaultChannel={thread?.channel}
        defaultTo={thread ? (thread.contact.phone || thread.contact.email || '') : ''}
        onSend={() => {
          // Refresh thread messages
          if (threadId) {
            fetchThread(threadId);
          }
        }}
      />
    </div>
  );
}

