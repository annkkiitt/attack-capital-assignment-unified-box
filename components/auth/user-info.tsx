"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
} | null;

export function UserInfo() {
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    // Get initial session
    authClient.getSession().then(({ data }) => {
      if (data?.user) {
        setSession({
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: data.user.image,
          },
        });
      } else {
        setSession(null);
      }
    });

    // Subscribe to session changes using onMount
    const handleSessionChange = () => {
      authClient.getSession().then(({ data }) => {
        if (data?.user) {
          setSession({
            user: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              image: data.user.image,
            },
          });
        } else {
          setSession(null);
        }
      });
    };

    // Listen for storage events (session changes in other tabs)
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="font-medium">{session.user.name}</p>
        <p className="text-sm text-gray-500">{session.user.email}</p>
      </div>
    </div>
  );
}

