import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import { Zap, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const techStack = [
  {
    icon: Zap,
    title: "Next.js 16",
    description: "App Router, TypeScript, Server Components",
    iconColor: "text-yellow-500",
  },
  {
    icon: Shield,
    title: "Better Auth",
    description: "Credentials + OAuth, Role-based access",
    iconColor: "text-blue-500",
  },
  {
    icon: CheckCircle2,
    title: "PostgreSQL + Prisma",
    description: "Type-safe database with migrations",
    iconColor: "text-green-500",
  },
  {
    icon: Sparkles,
    title: "Shadcn UI",
    description: "Beautiful, accessible components",
    iconColor: "text-purple-500",
  },
] as const;

export function TechStackSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Built With Modern Tech"
          description="Leveraging the best tools for performance and developer experience"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {techStack.map((tech) => {
            const Icon = tech.icon;
            return (
              <Card key={tech.title}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={cn("w-6 h-6", tech.iconColor)} />
                    <CardTitle className="text-lg">{tech.title}</CardTitle>
                  </div>
                  <CardDescription>{tech.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
