import { auth } from "./auth";

/**
 * Get the current session on the server side
 * Use this in Server Components, Server Actions, and API routes
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await import("next/headers").then((h) => h.headers()),
  });
}

/**
 * Require authentication - throws if user is not authenticated
 * Use this in Server Actions and API routes that require authentication
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

