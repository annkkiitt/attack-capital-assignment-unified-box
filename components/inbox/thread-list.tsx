'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Mail, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Thread {
  id: string;
  channel: 'sms' | 'whatsapp' | 'email';
  status: 'open' | 'closed' | 'archived';
  unreadCount: number;
  lastMessageAt: string | null;
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
    createdAt: string;
  }>;
}

interface ThreadListProps {
  onThreadSelect?: (threadId: string) => void;
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

export function ThreadList({ onThreadSelect }: ThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'open',
    channel: '',
    unreadOnly: false,
    search: '',
  });

  useEffect(() => {
    fetchThreads();
  }, [filters]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.channel) params.set('channel', filters.channel);
      if (filters.unreadOnly) params.set('unreadOnly', 'true');
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/inbox/threads?${params}`);
      if (!response.ok) throw new Error('Failed to fetch threads');
      
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getContactDisplay = (thread: Thread) => {
    return thread.contact.name || thread.contact.phone || thread.contact.email || 'Unknown';
  };

  const getLastMessage = (thread: Thread) => {
    if (thread.messages.length === 0) return 'No messages';
    const lastMsg = thread.messages[0];
    return lastMsg.subject || lastMsg.body || 'Media message';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading threads...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.status === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, status: 'open' })}
          >
            Open
          </Button>
          <Button
            variant={filters.status === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, status: 'closed' })}
          >
            Closed
          </Button>
          <Button
            variant={filters.unreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, unreadOnly: !filters.unreadOnly })}
          >
            Unread Only
          </Button>
          
          {/* Channel Filters */}
          <div className="flex gap-1 ml-auto">
            <Button
              variant={filters.channel === 'sms' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, channel: filters.channel === 'sms' ? '' : 'sms' })}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.channel === 'whatsapp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, channel: filters.channel === 'whatsapp' ? '' : 'whatsapp' })}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.channel === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, channel: filters.channel === 'email' ? '' : 'email' })}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No threads found
          </div>
        ) : (
          <div className="divide-y">
            {threads.map((thread) => {
              const ChannelIcon = channelIcons[thread.channel];
              return (
                <Card
                  key={thread.id}
                  className="border-0 rounded-none cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onThreadSelect?.(thread.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Channel Badge */}
                      <div className={`p-2 rounded-lg ${channelColors[thread.channel]}`}>
                        <ChannelIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">
                            {getContactDisplay(thread)}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(thread.lastMessageAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {getLastMessage(thread)}
                        </p>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {thread.channel.toUpperCase()}
                          </Badge>
                          {thread.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {thread.unreadCount} unread
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

