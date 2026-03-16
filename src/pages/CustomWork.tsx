import Navbar from "@/components/Navbar";
import SignatureWork from "@/components/SignatureWork";
import FooterSection from "@/components/FooterSection";
import Seo from "@/components/Seo";

export default function CustomWorkPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Custom Motorcycle Work in Kakinada | Bikers Choice"
        description="Explore Bikers Choice signature custom motorcycle builds, lighting upgrades, wraps and premium finishing in Kakinada."
        canonical="https://bikerschoicekakinada.vercel.app/custom-work"
      />
      <Navbar />
      <main className="pt-16">
        <SignatureWork />
      </main>
      <FooterSection />
    </div>
  );
}

