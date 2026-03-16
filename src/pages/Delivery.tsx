import Navbar from "@/components/Navbar";
import OnlineDelivery from "@/components/OnlineDelivery";
import FooterSection from "@/components/FooterSection";
import Seo from "@/components/Seo";

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Delivery of Bike Accessories Across Andhra Pradesh | Bikers Choice"
        description="Bikers Choice delivers premium motorcycle helmets, riding gear and bike accessories across Andhra Pradesh including Vizag, Rajahmundry and Tuni."
        canonical="https://bikerschoicekakinada.vercel.app/delivery"
      />
      <Navbar />
      <main className="pt-16">
        <OnlineDelivery />
      </main>
      <FooterSection />
    </div>
  );
}

