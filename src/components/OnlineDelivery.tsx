import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useDeliveryCategories } from "@/hooks/useDeliveryCategories";
import OptimizedImage from "./OptimizedImage";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";
import customBuild from "@/assets/bike3.jpg";
import lighting from "@/assets/bike1.jpg";

const getFallbackImage = (name: string): string | null => {
  const n = name.toLowerCase();
  if (n.includes("helmet")) return helmets;
  if (n.includes("tyre") || n.includes("wheel")) return tyres;
  if (n.includes("custom") || n.includes("build")) return customBuild;
  if (n.includes("light") || n.includes("led")) return lighting;
  return null;
};

const getCategoryStyles = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("part")) {
    return {
      gradient: "from-blue-600/20 via-slate-950 to-blue-900/10",
      border: "hover:border-blue-500/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      textColor: "text-blue-400 group-hover:text-blue-300",
    };
  }
  if (n.includes("light") || n.includes("led")) {
    return {
      gradient: "from-yellow-600/20 via-slate-950 to-amber-900/10",
      border: "hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
      textColor: "text-amber-400 group-hover:text-amber-300",
    };
  }
  if (n.includes("gear") || n.includes("ride") || n.includes("riding")) {
    return {
      gradient: "from-rose-600/20 via-slate-950 to-rose-900/10",
      border: "hover:border-rose-500/60 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]",
      textColor: "text-rose-400 group-hover:text-rose-300",
    };
  }
  if (n.includes("exhaust") || n.includes("silencer")) {
    return {
      gradient: "from-orange-600/20 via-slate-950 to-red-900/10",
      border: "hover:border-orange-500/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]",
      textColor: "text-orange-400 group-hover:text-orange-300",
    };
  }
  return {
    gradient: "from-cyan-600/20 via-slate-950 to-cyan-900/10",
    border: "hover:border-primary/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    textColor: "text-cyan-400 group-hover:text-cyan-300",
  };
};

const OnlineDelivery = () => {
  const navigate = useNavigate();
  const { categories, loading } = useDeliveryCategories();

  // Filter visible categories and limit to 6 (2 rows x 3 columns)
  const displayCategories = categories
    .filter((cat) => cat.visibility !== false)
    .slice(0, 6);

  return (
    <section id="delivery" className="py-16 px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-xl md:text-3xl font-display font-bold mb-3 neon-glow-cyan">
          Online Delivery
        </h2>
        <p className="text-muted-foreground text-sm mb-10 max-w-xl mx-auto">
          Online delivery is available. Browse our catalog of genuine motorcycle
          accessories and enquire via WhatsApp or Call.
        </p>

        {/* Categories Grid (2 rows x 3 columns) */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto mb-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-36 md:h-40 rounded-xl bg-muted/20 animate-pulse border border-border/30"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto mb-10">
            {displayCategories.map((cat, index) => {
              const fallbackImg = getFallbackImage(cat.name);
              const imageUrl = cat.icon_url || fallbackImg;
              const styles = getCategoryStyles(cat.name);

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => navigate(`/products?cat=${cat.id}`)}
                  className={`cursor-pointer group relative overflow-hidden rounded-xl border border-border/80 bg-card/45 transition-all duration-300 flex flex-col h-24 sm:h-36 md:h-40 ${styles.border}`}
                >
                  {imageUrl ? (
                    <OptimizedImage
                      src={imageUrl}
                      alt={cat.name}
                      className="group-hover:scale-105 transition-transform duration-500 absolute inset-0 opacity-75 group-hover:opacity-95"
                      widthLimit={600}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${styles.gradient} flex items-center justify-center absolute inset-0`}>
                      <span className={`text-3xl md:text-5xl font-display font-black tracking-tighter opacity-15 select-none ${styles.textColor}`}>
                        {cat.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Overlay gradient to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 text-center sm:text-left">
                    <p className="font-heading font-bold text-xs sm:text-sm md:text-base text-foreground tracking-wide line-clamp-1 group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA Button */}
        <motion.button
          onClick={() => navigate("/products")}
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(244, 63, 94, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full
                     bg-secondary text-secondary-foreground font-semibold text-sm sm:text-base
                     shadow-lg hover:shadow-secondary/40 transition-shadow duration-300"
        >
          <ShoppingBag size={18} />
          Browse All Products
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </section>
  );
};

export default OnlineDelivery;

