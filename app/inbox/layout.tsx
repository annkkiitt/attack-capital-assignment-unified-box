import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';

export default async function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  return <>{children}</>;
}

