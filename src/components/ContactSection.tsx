import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Instagram, Facebook, MapPin, Clock, Star } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ContactSection = () => {
  const { settings } = useSiteSettings();
  const facebookLink = settings.facebook_link || "#";
  const hoursLines = settings.working_hours
    .split(/\n|\|/g)
    .map((line) => line.trim())
    .filter(Boolean);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMapLoaded) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const timer = setTimeout(() => {
            setIsMapLoaded(true);
          }, 800);
          return () => clearTimeout(timer);
        }
      },
      { rootMargin: "150px" }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isMapLoaded]);

  return (
    <section id="contact" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        className="max-w-2xl mx-auto">

        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-8 neon-glow-red">
          Contact Us
        </h2>

        <div className="grid gap-3 mb-8">
          <a href="https://wa.me/918523876978" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
            <MessageCircle size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-heading font-semibold">+91 85238 76978</p>
            </div>
          </a>
          <a href="tel:+918523876978" className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
            <Phone size={20} className="text-secondary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Call</p>
              <p className="text-sm font-heading font-semibold">+91 85238 76978</p>
            </div>
          </a>
          <a href="mailto:bikerschoicekakinada390@gmail.com" className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
            <Mail size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-heading font-semibold">bikerschoicekakinada390@gmail.com</p>
            </div>
          </a>
          <div className="flex gap-3">
            <a href={settings.instagram_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
              <Instagram size={18} className="text-primary" />
              <span className="text-sm font-heading">Instagram</span>
            </a>
            <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
              <Facebook size={18} className="text-primary" />
              <span className="text-sm font-heading">Facebook</span>
            </a>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 mb-4">
          <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-heading font-semibold mb-1">Business Hours</p>
            {hoursLines.map((line, idx) => (
              <p key={idx} className="text-sm font-bold text-foreground">{line}</p>
            ))}
          </div>
        </div>

        {/* Google Review */}
        <a
          href="https://maps.app.goo.gl/fL4Lk5HGVNdVyu2d8"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 font-heading font-semibold py-3 px-4 rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors mb-6">

          <Star size={16} /> Open Bikers Choice on Google Maps
        </a>

        {/* Map */}
        <div ref={mapRef} className="rounded-xl overflow-hidden border border-border h-[250px] relative bg-muted/20">
          {isMapLoaded ? (
            <iframe
              src={settings.map_embed}
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bikers Choice Kakinada Location"
            />
          ) : (
            <button
              onClick={() => setIsMapLoaded(true)}
              className="w-full h-full flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm group hover:bg-card/85 transition-all p-6 text-center select-none"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MapPin size={22} className="animate-pulse" />
              </div>
              <p className="text-sm font-heading font-semibold text-foreground">Interactive Location Map</p>
              <p className="text-xs text-muted-foreground/80 mt-1 mb-3">Click to load the live map of Bikers Choice, Kakinada</p>
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold border border-primary/20 rounded-full px-3 py-1 bg-primary/5">
                Load Map
              </span>
            </button>
          )}
        </div>

        <a
          href="https://maps.app.goo.gl/fL4Lk5HGVNdVyu2d8"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 font-heading font-semibold py-2.5 px-4 rounded-full text-sm mt-4 hover:bg-primary hover:text-primary-foreground transition-colors">
          <MapPin size={16} /> Open Directions to Our Shop
        </a>
      </motion.div>
    </section>);

};

export default ContactSection;
