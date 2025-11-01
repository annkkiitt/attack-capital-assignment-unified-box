This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- ✅ **Authentication**: Better Auth with email/password authentication
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **TypeScript**: Full type safety
- ✅ **Next.js 16**: App Router with React Server Components

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Generate with `npx @better-auth/cli secret` or use a secure random string
- `DIRECT_URL`: Same as DATABASE_URL (required for migrations)

### 3. Set Up Database

Make sure PostgreSQL is running and create a database:

```bash
# Example: Create database using psql
psql -U postgres
CREATE DATABASE my_database;
```

### 4. Run Migrations

```bash
npm run db:migrate
```

This will:
- Generate Prisma Client
- Create all necessary database tables (User, Session, Account, Verification)

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Setup

Better Auth is configured with email/password authentication. The following files have been set up:

- `lib/auth.ts` - Server-side auth configuration
- `lib/auth-client.ts` - Client-side auth client (React)
- `lib/auth-server.ts` - Server-side helpers (getSession, requireAuth)
- `app/api/auth/[...all]/route.ts` - Auth API routes
- `components/auth/` - Auth UI components (SignInForm, SignUpForm, SignOutButton, UserInfo)

### Using Authentication

#### Client Components

```tsx
"use client";
import { authClient } from "@/lib/auth-client";

// Sign up
await authClient.signUp.email({ email, password, name });

// Sign in
await authClient.signIn.email({ email, password });

// Sign out
await authClient.signOut();

// Get session
const { data } = await authClient.getSession();
```

#### Server Components / Server Actions

```tsx
import { getSession, requireAuth } from "@/lib/auth-server";

// Get session (returns null if not authenticated)
const session = await getSession();

// Require auth (throws if not authenticated)
const session = await requireAuth();
```

## Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and run migration
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure

```
├── app/
│   ├── api/auth/[...all]/    # Better Auth API routes
│   └── ...
├── components/
│   └── auth/                  # Auth UI components
├── lib/
│   ├── auth.ts                # Better Auth server config
│   ├── auth-client.ts         # Better Auth React client
│   ├── auth-server.ts         # Server-side auth helpers
│   └── db.ts                  # Prisma client
└── prisma/
    └── schema.prisma          # Database schema
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to set all environment variables in your Vercel project settings.
