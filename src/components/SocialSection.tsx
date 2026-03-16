import { motion } from "framer-motion";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import InstagramCounter from "./InstagramCounter";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const SocialSection = () => {
  const { settings } = useSiteSettings();
  const facebookLink = settings.facebook_link || "#";

  return (
    <section id="social" className="py-16 px-4 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        className="max-w-lg mx-auto text-center"
      >
        <h2 className="text-xl md:text-3xl font-display font-bold mb-4 neon-glow-cyan">
          Follow Our Build Journey
        </h2>
        <p className="text-muted-foreground text-sm mb-2">Daily custom work & updates</p>
        <p className="text-muted-foreground text-sm mb-8">
          Join{" "}
          <span className="font-medium text-primary">
            <InstagramCounter />
          </span>{" "}
          riders
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={settings.instagram_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-primary text-primary-foreground font-heading font-bold py-4 px-6 rounded-full text-base neon-border-cyan hover:scale-105 transition-transform"
          >
            <Instagram size={22} /> Follow on Instagram
          </a>
          <a
            href={facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-muted text-foreground font-heading font-bold py-4 px-6 rounded-full text-base hover:scale-105 transition-transform border border-border"
          >
            <Facebook size={22} /> Follow on Facebook
          </a>
          <a
            href="https://wa.me/918523876978"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-secondary text-secondary-foreground font-heading font-bold py-4 px-6 rounded-full text-base neon-border-red hover:scale-105 transition-transform"
          >
            <MessageCircle size={22} /> Contact on WhatsApp
          </a>
        </div>
      </motion.div>
    </section>
  );
};

export default SocialSection;
