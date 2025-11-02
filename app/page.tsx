import {
  HeroSection,
  FeaturesSection,
  IntegrationTable,
  Footer,
} from "@/components/landing";

export default async function Home() {

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <IntegrationTable />
      <Footer />
    </div>
  );
}
