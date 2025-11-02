'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Calendar, 
  X, 
  Image as ImageIcon,
  Phone,
  MessageSquare,
  Mail,
  Loader2
} from 'lucide-react';

interface MessageComposerProps {
  threadId?: string;
  contactId?: string;
  defaultChannel?: 'sms' | 'whatsapp' | 'email';
  defaultTo?: string;
  onSend?: () => void;
  onClose?: () => void;
  lockChannel?: boolean; // When true, lock channel to thread's channel
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

export function MessageComposer({
  threadId,
  contactId,
  defaultChannel = 'sms',
  defaultTo,
  onSend,
  onClose,
  lockChannel = false,
}: MessageComposerProps) {
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>(defaultChannel);
  const [to, setTo] = useState(defaultTo || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to || !body.trim()) {
      setError('Recipient and message body are required');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Prepare form data for file uploads
      const formData = new FormData();
      formData.append('channel', channel);
      formData.append('to', to);
      formData.append('body', body);
      if (subject) formData.append('subject', subject);
      if (scheduledFor) formData.append('scheduledFor', scheduledFor);
      
      // Add files if any
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // For now, send without files (files need backend handling)
      const payload = {
        channel,
        to,
        body,
        subject: channel === 'email' ? subject : undefined,
        scheduledFor: scheduledFor || undefined,
      };

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Clear form
      setBody('');
      setSubject('');
      setFiles([]);
      setScheduledFor('');
      
      // Refresh thread if replying
      if (threadId) {
        // Trigger refresh in parent component
        onSend?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const characterLimit = channel === 'sms' ? 160 : channel === 'whatsapp' ? 4096 : undefined;
  const remainingChars = characterLimit ? characterLimit - body.length : undefined;

  return (
    <div className="border-t bg-background p-4 space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Channel Selector - Locked when replying in thread */}
      {lockChannel ? (
        <div className="flex items-center gap-2">
          <Label className="text-sm">Channel:</Label>
          <Badge className={channelColors[channel]}>
            {(() => {
              const Icon = channelIcons[channel];
              return Icon ? <Icon className="h-3 w-3 mr-1" /> : null;
            })()}
            {channel.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            (locked to thread channel)
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Label className="text-sm">Channel:</Label>
          <div className="flex gap-1">
            {(['sms', 'whatsapp', 'email'] as const).map((ch) => {
              const Icon = channelIcons[ch];
              return (
                <Button
                  key={ch}
                  type="button"
                  variant={channel === ch ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannel(ch)}
                  className={channel === ch ? channelColors[ch] : ''}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {ch.toUpperCase()}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipient (if not in thread context) */}
      {!threadId && (
        <div>
          <Label htmlFor="to">To:</Label>
          <Input
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={channel === 'email' ? 'email@example.com' : '+1234567890'}
            className="mt-1"
          />
        </div>
      )}

      {/* Subject (Email only) */}
      {channel === 'email' && (
        <div>
          <Label htmlFor="subject">Subject:</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="mt-1"
          />
        </div>
      )}

      {/* Message Body */}
      <div>
        <Label htmlFor="body">Message:</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            channel === 'email'
              ? 'Type your email message...'
              : 'Type your message...'
          }
          rows={4}
          className="mt-1"
          maxLength={characterLimit}
        />
        {characterLimit && (
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {body.length} / {characterLimit} characters
            {remainingChars !== undefined && remainingChars < 0 && (
              <span className="text-destructive"> (over limit)</span>
            )}
          </div>
        )}
      </div>

      {/* File Attachments */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Attachments:</Label>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <Badge key={index} variant="outline" className="gap-2">
                <ImageIcon className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Option */}
      <div>
        <Label htmlFor="schedule">Schedule (Optional):</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            id="schedule"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="flex-1"
          />
          {scheduledFor && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setScheduledFor('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          {scheduledFor && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              Scheduled
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSend}
            disabled={sending || !body.trim() || (characterLimit ? body.length > characterLimit : false)}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {scheduledFor ? 'Schedule' : 'Send'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}