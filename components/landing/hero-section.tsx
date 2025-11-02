import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth-server";

export async function HeroSection() {
  const session = await getSession();
  const isAuthenticated = !!session?.user;

  return (
    <section className="relative h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-800 to-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-white/30">
            <Sparkles className="w-3 h-3 mr-2" />
            By Attack Capital
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            All Your Messages.
            <br />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              One Inbox.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Manage SMS, WhatsApp, and Email conversations from a single, powerful interface.
            Built for teams that communicate at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90">
              {isAuthenticated ? <Link href="/inbox">Go to Inbox</Link> : <Link href="/login">Get Started</Link>}
            </Button>
            {!isAuthenticated && <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              <Link href="/signup">Sign Up Free</Link>
            </Button>}
          </div>
        </div>
      </div>
    </section>
  );
}

