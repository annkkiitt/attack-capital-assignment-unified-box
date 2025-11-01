import {
  HeroSection,
  FeaturesSection,
  IntegrationTable,
  TechStackSection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <IntegrationTable />
      <TechStackSection />
      <Footer />
    </div>
  );
}
