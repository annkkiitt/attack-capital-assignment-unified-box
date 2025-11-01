import { FeatureCard } from "./feature-card";
import { SectionHeader } from "./section-header";
import {
  MessageSquare,
  Users,
  Send,
  Calendar,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Unified Inbox",
    description: "All your SMS, WhatsApp, and Email conversations in one Kanban-style interface",
    iconBgColor: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Users,
    title: "Smart Contacts",
    description: "Auto-merge duplicate contacts and maintain unified conversation history",
    iconBgColor: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Send,
    title: "Multi-Channel",
    description: "Send messages via SMS, WhatsApp, or Email with media attachments",
    iconBgColor: "bg-green-500/20",
    iconColor: "text-green-400",
  },
  {
    icon: Calendar,
    title: "Schedule Messages",
    description: "Queue messages for later delivery with our built-in scheduling system",
    iconBgColor: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Notes with @mentions, presence indicators, and activity feeds",
    iconBgColor: "bg-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track engagement metrics, response times, and channel performance",
    iconBgColor: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Everything You Need"
          description="Powerful features to streamline your communication workflow"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

