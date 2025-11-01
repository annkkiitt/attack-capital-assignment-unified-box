import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconBgColor = "bg-blue-500/20",
  iconColor = "text-blue-400",
}: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", iconBgColor)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

