# Simplified Architecture Overview

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│  (Next.js Pages: Inbox, Login, Settings)               │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  API Routes Layer                       │
│  • /api/auth/*      - Authentication                   │
│  • /api/inbox/*     - Thread & Message CRUD           │
│  • /api/messages/*  - Send messages                    │
│  • /api/webhooks/*  - Receive inbound messages         │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer                       │
│  ┌──────────────────────────────────────┐              │
│  │   Integration Factory Pattern        │              │
│  │   • Twilio SMS                       │              │
│  │   • Twilio WhatsApp                  │              │
│  │   • Resend Email                     │              │
│  └──────────────────────────────────────┘              │
│  • Contact Management (auto-merge)                     │
│  • Message Threading                                   │
│  • Authentication (Better Auth)                       │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Access Layer                      │
│  • Prisma ORM                                          │
│  • Database Queries                                     │
│  • Transaction Management                              │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Database                              │
│              PostgreSQL                                  │
│  • Users, Contacts, Threads, Messages                  │
│  • ScheduledMessages, Notes, Analytics                 │
└─────────────────────────────────────────────────────────┘

                    ▲
                    │
┌─────────────────────────────────────────────────────────┐
│              External Services                          │
│  • Twilio (SMS/WhatsApp)                               │
│  • Resend (Email)                                      │
│  • Webhooks (Inbound Messages)                         │
└─────────────────────────────────────────────────────────┘
```

## Message Flow

### Sending a Message
```
User Input
    ↓
Message Composer (UI)
    ↓
POST /api/messages/send
    ↓
Integration Factory
    ↓
Channel Sender (SMS/WhatsApp/Email)
    ↓
External API (Twilio/Resend)
    ↓
Store in Database
    ↓
Update UI
```

### Receiving a Message
```
External Service (Twilio)
    ↓
Webhook Callback
    ↓
POST /api/webhooks/twilio
    ↓
Parse & Validate
    ↓
Store Message in Database
    ↓
Create/Update Contact
    ↓
Update Thread
    ↓
UI Polls & Refreshes (5s interval)
```

## Component Relationships

```
InboxPage
├── ThreadList
│   └── Fetches: GET /api/inbox/threads
│
├── ThreadView
│   ├── Fetches: GET /api/inbox/threads/[id]
│   └── MessageComposer (reply)
│       └── POST /api/messages/send
│
└── MessageComposer (new message)
    └── POST /api/messages/send
```

## Integration Pattern

```
┌─────────────────────┐
│  Message Payload    │
│  (Unified Format)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Integration Factory │
└──────────┬──────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
┌─────┐ ┌─────┐ ┌─────┐
│ SMS │ │ WA  │ │Email│
└─────┘ └─────┘ └─────┘
    │      │      │
    ▼      ▼      ▼
┌─────────────────────┐
│   External APIs      │
└─────────────────────┘
```

