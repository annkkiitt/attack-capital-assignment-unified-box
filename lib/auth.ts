import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Automatically sign in after sign up
  },
  // Base URL for your application
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  // Secret key for signing tokens (generate with: npx @better-auth/cli secret)
  secret: process.env.BETTER_AUTH_SECRET || "change-this-secret-key-in-production",
  // Trust proxy if behind a reverse proxy
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [],
});

