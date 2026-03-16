import Navbar from "@/components/Navbar";
import ContactSection from "@/components/ContactSection";
import FooterSection from "@/components/FooterSection";
import Seo from "@/components/Seo";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Contact Bikers Choice Kakinada | Bike Accessories & Modifications"
        description="Contact Bikers Choice in Kakinada for helmets, riding gear, motorcycle accessories and custom bike modification work. Visit our store or message on WhatsApp."
        canonical="https://bikerschoicekakinada.vercel.app/contact"
      />
      <Navbar />
      <main className="pt-16">
        <ContactSection />
      </main>
      <FooterSection />
    </div>
  );
}

