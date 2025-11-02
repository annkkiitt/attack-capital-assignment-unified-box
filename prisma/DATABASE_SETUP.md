# Database Setup Guide

## Schema Overview

The Prisma schema includes the following models:

### Core Models
- **User** - Users with role-based access (viewer/editor/admin)
- **Contact** - Unified contacts with phone, email, social handles
- **Thread** - Conversation threads grouping messages by contact/channel
- **Message** - Unified messages across SMS/WhatsApp/Email
- **MessageAttachment** - Media attachments (images, documents, etc.)

### Feature Models
- **ScheduledMessage** - Queued messages for future delivery
- **Note** - Internal notes with @mentions support
- **AnalyticsEvent** - Engagement metrics tracking

## Setup Steps

### 1. Configure Database Connection

Make sure your `.env.local` has:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox"
DIRECT_URL="postgresql://user:password@localhost:5432/unified_inbox"
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Create Migration

```bash
npx prisma migrate dev --name init_unified_inbox
```

This will:
- Create migration files in `prisma/migrations/`
- Apply the migration to your database
- Generate Prisma Client with all models

### 4. (Optional) View Database

```bash
npx prisma studio
```

Opens a visual database browser at `http://localhost:5555`

## Schema Relationships

```
User
├── messages (Messages sent by user)
├── notes (Notes created by user)
├── scheduledMessages (Scheduled messages by user)
└── analyticsEvents (Analytics events by user)

Contact
├── threads (Conversation threads)
├── notes (Internal notes)
├── scheduledMessages (Scheduled messages to contact)
└── analyticsEvents (Analytics events)

Thread
├── contact (Contact this thread belongs to)
└── messages (Messages in this thread)

Message
├── thread (Thread this message belongs to)
├── user (User who sent it, if outbound)
├── attachments (Media attachments)
└── analyticsEvents (Analytics events)

ScheduledMessage
├── user (User who scheduled it)
└── contact (Contact to send to)

Note
├── contact (Contact this note is about)
├── user (User who created the note)
└── mentionedUserIds (User IDs mentioned via @mentions)

AnalyticsEvent
├── contact (Related contact, optional)
├── message (Related message, optional)
└── user (Related user, optional)
```

## Key Features

### Contact Auto-Merge
- `mergedFromIds` array tracks contacts merged into this one
- Can implement fuzzy matching logic in application code

### Message Threading
- Messages grouped by contact and channel in Thread model
- Supports multiple threads per contact (one per channel)
- `unreadCount` and `lastMessageAt` for inbox display

### Role-Based Access
- User roles: `viewer`, `editor`, `admin`
- Enforced in application logic (not database level)

### @Mentions in Notes
- `mentionedUserIds` array stores mentioned users
- Parse `@username` patterns from note content in application code

## Migration Notes

### First Migration
The first migration will create all tables with indexes. This may take a few minutes depending on your database.

### Indexes Created
- Contact: phone, email, status
- Thread: contactId, status, lastMessageAt
- Message: threadId, channel, direction, status, externalId, createdAt
- ScheduledMessage: userId, contactId, scheduledFor, executed
- Note: contactId, userId, createdAt
- AnalyticsEvent: contactId, messageId, userId, eventType, channel, createdAt

### Unique Constraints
- User: email (unique)
- Contact: phone and email are indexed but not unique (to allow nulls)

## Troubleshooting

### Error: DATABASE_URL not set
- Ensure `.env.local` exists with DATABASE_URL
- Restart your terminal/IDE after adding environment variables

### Error: Connection refused
- Ensure PostgreSQL is running
- Check connection string format: `postgresql://user:password@host:port/database`

### Error: Database does not exist
- Create database first: `CREATE DATABASE unified_inbox;`
- Or update DATABASE_URL to point to existing database

### Error: Migration conflicts
- If schema was manually modified, you may need to reset:
  ```bash
  npx prisma migrate reset
  ```
  ⚠️ **Warning**: This will delete all data!

