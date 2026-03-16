import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import InstagramCounter from "./InstagramCounter";

const bullets = [
  "Premium finishing",
  "LED & paint expertise",
  "Unique custom builds",
  "Clean workshop",
  "Fast delivery",
  "Friendly communication",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-16 px-4 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-6 neon-glow-cyan">
          About Us
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
          Bikers Choice Kakinada delivers premium custom builds, LED mods, wraps, paint jobs, and
          performance upgrades. With 4+ years of experience and a{" "}
          <span className="font-medium text-primary">
            <InstagramCounter />
          </span>{" "}
          rider Instagram community, we focus on aggressive street-bike styling and high-end
          finishing.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-sm"
            >
              <CheckCircle size={14} className="text-primary flex-shrink-0" />
              <span>{b}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
