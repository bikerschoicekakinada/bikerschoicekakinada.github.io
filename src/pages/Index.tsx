import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SignatureWork from "@/components/SignatureWork";
import SocialSection from "@/components/SocialSection";
import ServicesSection from "@/components/ServicesSection";
import GallerySection from "@/components/GallerySection";
import OnlineDelivery from "@/components/OnlineDelivery";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SignatureWork />
      <SocialSection />
      <ServicesSection />
      <GallerySection />
      <OnlineDelivery />
      <AboutSection />
      <ContactSection />
      <section className="py-14 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-4 neon-glow-cyan">
            Bike Accessories and Motorcycle Modification Shop in Kakinada
          </h2>
          <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed mb-8">
            Bikers Choice is a premium bike accessories and motorcycle modification shop in Kakinada offering helmets,
            riding gear, fog lights, tyres and custom motorcycle upgrades. Riders can visit our store in Kakinada or
            order accessories online with courier delivery across Andhra Pradesh including Vizag, Rajahmundry and Tuni.
          </p>

          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-heading font-semibold mb-3">Explore city pages</p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/bike-accessories-vizag"
                className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold bg-muted text-muted-foreground hover:text-foreground hover:border-primary border border-border transition-colors"
              >
                Bike Accessories in Vizag
              </a>
              <a
                href="/bike-accessories-rajahmundry"
                className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold bg-muted text-muted-foreground hover:text-foreground hover:border-primary border border-border transition-colors"
              >
                Bike Accessories in Rajahmundry
              </a>
              <a
                href="/bike-accessories-tuni"
                className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold bg-muted text-muted-foreground hover:text-foreground hover:border-primary border border-border transition-colors"
              >
                Bike Accessories in Tuni
              </a>
              <a
                href="/bike-accessories-samalkot"
                className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold bg-muted text-muted-foreground hover:text-foreground hover:border-primary border border-border transition-colors"
              >
                Bike Accessories in Samalkot
              </a>
            </div>
          </div>
        </div>
      </section>
      <FooterSection />
    </div>
  );
};

export default Index;
