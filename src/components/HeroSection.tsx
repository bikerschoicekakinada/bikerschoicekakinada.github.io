import { useSiteSettings } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, Instagram, MapPin, Truck, Compass } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import InstagramCounter from "./InstagramCounter";

const HeroSection = () => {
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-red/5 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl">

        {/* Logo */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-primary neon-border-cyan mb-8 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
          <img src={logo} alt="Bikers Choice Kakinada Logo" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4 neon-glow-cyan max-w-3xl">
          Premium Bike Modification & Custom Builds in Kakinada
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mb-8 font-body px-2">
          {settings.hero_subtitle}
        </p>

        {/* CTAs - 3 responsive buttons designed for mobile accessibility */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-md sm:max-w-2xl px-2">
          <motion.a
            href="https://wa.me/918523876978"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 0 15px rgba(34, 211, 238, 0.4)" }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 flex items-center justify-center gap-2.5 bg-primary text-primary-foreground font-heading font-bold py-3.5 px-6 rounded-full text-sm sm:text-base neon-border-cyan transition-shadow duration-300"
          >
            <MessageCircle size={18} /> WhatsApp Us
          </motion.a>

          {settings.online_delivery_button_enabled && (
            <motion.button
              onClick={() => navigate("/products")}
              whileHover={{ scale: 1.04, boxShadow: "0 0 15px rgba(244, 63, 94, 0.4)" }}
              whileTap={{ scale: 0.96 }}
              className="flex-1 flex items-center justify-center gap-2.5 bg-secondary text-secondary-foreground font-heading font-bold py-3.5 px-6 rounded-full text-sm sm:text-base neon-border-red transition-shadow duration-300"
            >
              <Truck size={18} /> Online Delivery
            </motion.button>
          )}

          <motion.a
            href="tel:+918523876978"
            whileHover={{ scale: 1.04, boxShadow: "0 0 15px rgba(255, 255, 255, 0.15)" }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 flex items-center justify-center gap-2.5 bg-card border border-border text-foreground font-heading font-bold py-3.5 px-6 rounded-full text-sm sm:text-base hover:border-primary/50 transition-shadow duration-300"
          >
            <Phone size={18} /> Call Now
          </motion.a>
        </div>

        {/* Instagram Badge with live counter */}
        <motion.a
          href={settings.instagram_link}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2 bg-surface border px-4 py-2 rounded-full text-xs text-muted-foreground hover:text-primary transition-colors mb-6 shadow font-semibold border-primary">
          <Instagram size={14} className="text-primary" />
          Follow us on Instagram –{" "}
          <span className="font-medium text-primary">
            <InstagramCounter />
          </span>{" "}
          riders
        </motion.a>

        {/* Location */}
        <motion.a
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2 bg-card border border-border px-5 py-3 rounded-full text-sm font-heading font-semibold text-foreground hover:border-primary hover:text-primary transition-colors shadow mb-6" href="https://maps.app.goo.gl/fL4Lk5HGVNdVyu2d8">
          <MapPin size={16} className="text-secondary" /> Open Google Maps Directions
        </motion.a>

        {/* Design Explorer Badge */}
        <motion.a
          href="https://bikerschoicekakinada-designexplorer.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2 bg-surface border px-4 py-2 rounded-full text-xs text-muted-foreground hover:text-primary transition-colors shadow font-semibold border-primary">
          <Compass size={14} className="text-primary" />
          Explore More Designs
        </motion.a>
      </motion.div>

      {/* Floating Online Delivery Button - controlled by admin settings */}
      {settings.online_delivery_button_enabled && (
        <motion.button
          onClick={() => navigate("/products")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-primary text-primary-foreground font-heading font-bold py-2.5 px-4 rounded-full text-sm shadow-lg neon-border-cyan animate-pulse-neon transition-transform">
          <Truck size={16} /> Online Delivery
        </motion.button>
      )}
    </section>
  );
};

export default HeroSection;
