'use client';

import { format } from 'date-fns';
import { Download, Image as ImageIcon, FileText, Video, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  url: string | null;
  size: number | null;
}

interface MessageUser {
  id: string;
  name: string;
  image: string | null;
}

interface Message {
  id: string;
  body: string | null;
  subject: string | null;
  htmlBody: string | null;
  direction: 'inbound' | 'outbound';
  status: string;
  from: string;
  fromName: string | null;
  errorMessage: string | null;
  createdAt: string;
  attachments: MessageAttachment[];
  user?: MessageUser | null;
}

interface MessageItemProps {
  message: Message;
  contactName?: string;
}

export function MessageItem({ message, contactName }: MessageItemProps) {
  const isOutbound = message.direction === 'outbound';
  const senderName = isOutbound 
    ? (message.user?.name || 'You') 
    : (contactName || message.fromName || 'Unknown');

  return (
    <div className={`flex gap-3 p-4 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col gap-2 max-w-[70%] ${isOutbound ? 'items-end' : 'items-start'}`}>
        {/* Message Header */}
        <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isOutbound ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium">{senderName}</span>
          <span>•</span>
          <span>{format(new Date(message.createdAt), 'MMM d, h:mm a')}</span>
        </div>

        {/* Message Content */}
        <div className={`
          rounded-lg px-4 py-2
          ${isOutbound 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
          }
        `}>
          {/* Email Subject */}
          {message.subject && (
            <div className="font-semibold mb-2 border-b pb-1">
              {message.subject}
            </div>
          )}

          {/* Message Body */}
          {message.body && (
            <div className="whitespace-pre-wrap break-words">
              {message.body}
            </div>
          )}

          {/* HTML Body (for email) */}
          {message.htmlBody && (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: message.htmlBody }}
            />
          )}

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <AttachmentDisplay key={attachment.id} attachment={attachment} />
              ))}
            </div>
          )}

          {/* Error Message */}
          {message.errorMessage && (
            <div className="mt-2 text-xs text-destructive">
              Error: {message.errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentDisplay({ attachment }: { attachment: MessageAttachment }) {
  const isImage = attachment.contentType.startsWith('image/');
  const isVideo = attachment.contentType.startsWith('video/');
  const isAudio = attachment.contentType.startsWith('audio/');

  return (
    <div className="border rounded-lg p-2 bg-background/50">
      {isImage && attachment.url ? (
        <div className="space-y-2">
          <img 
            src={attachment.url} 
            alt={attachment.filename}
            className="max-w-full h-auto rounded max-h-64"
            loading="lazy"
          />
          <a
            href={attachment.url}
            download={attachment.filename}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            {attachment.filename}
          </a>
        </div>
      ) : (
        <a
          href={attachment.url || '#'}
          download={attachment.filename}
          className="flex items-center gap-2 text-sm hover:underline"
        >
          {isVideo ? (
            <Video className="h-4 w-4" />
          ) : isAudio ? (
            <Music className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="truncate">{attachment.filename}</span>
          <span className="text-xs text-muted-foreground">
            ({attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'})
          </span>
        </a>
      )}
    </div>
  );
}

