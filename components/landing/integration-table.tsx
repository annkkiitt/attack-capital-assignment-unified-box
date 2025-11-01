import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "./section-header";
import { Phone, MessageSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationRow {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  latency: string;
  cost: string;
  reliability: "High" | "Medium" | "Low";
  features: string;
}

const integrations: IntegrationRow[] = [
  {
    name: "SMS (Twilio)",
    icon: Phone,
    iconColor: "text-blue-600",
    latency: "~2-5s",
    cost: "$0.0075/msg",
    reliability: "High",
    features: "Text, MMS",
  },
  {
    name: "WhatsApp (Twilio)",
    icon: MessageSquare,
    iconColor: "text-green-600",
    latency: "~3-8s",
    cost: "$0.005/msg",
    reliability: "High",
    features: "Rich media, read receipts",
  },
  {
    name: "Email (Resend)",
    icon: Mail,
    iconColor: "text-purple-600",
    latency: "~1-10s",
    cost: "$0.10/1000",
    reliability: "Medium",
    features: "HTML, attachments",
  },
];

const reliabilityBadgeStyles = {
  High: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Low: "bg-red-500/20 text-red-400 border-red-500/30",
} as const;

export function IntegrationTable() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Channel Comparison"
          description="Choose the right channel for every conversation"
        />
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-4 text-left font-semibold">Channel</th>
                      <th className="px-6 py-4 text-left font-semibold">Latency</th>
                      <th className="px-6 py-4 text-left font-semibold">Cost</th>
                      <th className="px-6 py-4 text-left font-semibold">Reliability</th>
                      <th className="px-6 py-4 text-left font-semibold">Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <tr
                          key={integration.name}
                          className="border-b hover:bg-muted/30 transition-colors last:border-b-0"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Icon className={cn("w-4 h-4", integration.iconColor)} />
                              <span className="font-medium">{integration.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{integration.latency}</td>
                          <td className="px-6 py-4">{integration.cost}</td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={reliabilityBadgeStyles[integration.reliability]}
                            >
                              {integration.reliability}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">{integration.features}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
