import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import ServicesSection from "@/components/ServicesSection";
import OnlineDelivery from "@/components/OnlineDelivery";
import Seo from "@/components/Seo";

type BikeAccessoriesCityProps = {
  cityName: string;
  title: string;
  paragraph: string;
  canonicalPath: string;
};

export default function BikeAccessoriesCityPage({
  cityName,
  title,
  paragraph,
  canonicalPath,
}: BikeAccessoriesCityProps) {
  return (
    <div className="min-h-screen bg-background">
      <Seo title={title} description={paragraph} canonical={`https://bikerschoicekakinada.vercel.app${canonicalPath}`} />
      <Navbar />
      <main className="pt-16">
        <section className="py-10 px-4 bg-surface">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-xl md:text-3xl font-display font-bold mb-4 neon-glow-cyan">
              Bike Accessories in {cityName}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{paragraph}</p>
          </div>
        </section>

        <ServicesSection />
        <OnlineDelivery />
      </main>
      <FooterSection />
    </div>
  );
}

