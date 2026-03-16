import { useSiteSettings } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Instagram, MapPin, Truck } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import InstagramCounter from "./InstagramCounter";

const HeroSection = () => {
  const { settings } = useSiteSettings();

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-red/5 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center text-center">

        {/* Logo */}
        <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-2 border-primary neon-border-cyan mb-6">
          <img src={logo} alt="Bikers Choice Kakinada Logo" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4 neon-glow-cyan max-w-3xl">
          Premium Bike Modification & Custom Builds in Kakinada
        </h1>

        <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6 font-body">
          {settings.hero_subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-sm">
          <a
            href="https://wa.me/918523876978"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-heading font-bold py-3 px-6 rounded-full text-sm neon-border-cyan hover:scale-105 transition-transform">

            <MessageCircle size={18} /> WhatsApp Us
          </a>
          <a
            href="tel:+918523876978"
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-heading font-bold py-3 px-6 rounded-full text-sm neon-border-red hover:scale-105 transition-transform">

            <Phone size={18} /> Call Now
          </a>
        </div>

        {/* Instagram Badge with live counter */}
        <a
          href={settings.instagram_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-surface border px-4 py-2 rounded-full text-xs text-muted-foreground hover:text-primary transition-colors mb-4 shadow font-semibold border-primary">

          <Instagram size={14} className="text-primary" />
          Follow us on Instagram –{" "}
          <span className="font-medium text-primary">
            <InstagramCounter />
          </span>{" "}
          riders
        </a>

        {/* Location */}
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-full text-sm font-heading font-semibold text-foreground hover:border-primary hover:text-primary transition-colors shadow" href="https://maps.app.goo.gl/fL4Lk5HGVNdVyu2d8">
          <MapPin size={16} className="text-secondary" /> Open Google Maps Directions
        </a>
      </motion.div>

      {/* Floating Online Delivery Button - controlled by admin settings */}
      {settings.online_delivery_button_enabled && (
        <a
          href="#delivery"
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-primary text-primary-foreground font-heading font-bold py-2.5 px-4 rounded-full text-sm shadow-lg neon-border-cyan animate-pulse-neon hover:scale-110 transition-transform">

          <Truck size={16} /> Online Delivery
        </a>
      )}
    </section>);

};

export default HeroSection;
