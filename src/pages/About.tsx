import Navbar from "@/components/Navbar";
import AboutSection from "@/components/AboutSection";
import FooterSection from "@/components/FooterSection";
import Seo from "@/components/Seo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="About Bikers Choice Kakinada | Bike Accessories & Custom Work"
        description="Bikers Choice is a premium bike accessories and motorcycle modification shop in Kakinada offering custom work, helmets, riding gear and delivery across Andhra Pradesh."
        canonical="https://bikerschoicekakinada.vercel.app/about"
      />
      <Navbar />
      <main className="pt-16">
        <AboutSection />
      </main>
      <FooterSection />
    </div>
  );
}

