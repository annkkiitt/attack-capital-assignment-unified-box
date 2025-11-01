import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description: string;
  className?: string;
}

export function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("text-center mb-16", className)}>
      <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{description}</p>
    </div>
  );
}

