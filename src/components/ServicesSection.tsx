import { motion } from "framer-motion";
import { MessageCircle, Paintbrush, Lightbulb, Wrench } from "lucide-react";

const serviceGroups = [
  {
    title: "Customization",
    icon: Paintbrush,
    items: ["Full body modification", "Hydro dipping", "Custom premium paintings", "Wraps & stickers", "Alloy customization"],
  },
  {
    title: "Lighting",
    icon: Lightbulb,
    items: ["LED strips", "Neon underglow", "Headlight upgrades", "Switch integration"],
  },
  {
    title: "Fitting & Accessories",
    icon: Wrench,
    items: ["Helmets", "Tyres fitting", "Parts fitting & selling"],
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-8 neon-glow-cyan">
          Our Services
        </h2>
      </motion.div>

      <div className="max-w-4xl mx-auto grid gap-4 md:grid-cols-3">
        {serviceGroups.map((group, gi) => (
          <motion.div
            key={gi}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: gi * 0.15 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <group.icon size={20} className="text-primary" />
              <h3 className="font-heading font-bold text-base">{group.title}</h3>
            </div>
            <ul className="space-y-2 mb-4">
              {group.items.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1 text-xs">▸</span> {item}
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/918523876978"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 font-heading font-semibold py-2 px-4 rounded-full text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <MessageCircle size={14} /> Tap to Contact on WhatsApp
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;
