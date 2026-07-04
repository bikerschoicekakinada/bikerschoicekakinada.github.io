import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useDeliveryCategories } from "@/hooks/useDeliveryCategories";

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
            {displayCategories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => navigate(`/products?cat=${cat.id}`)}
                className="cursor-pointer group relative overflow-hidden rounded-xl border border-border bg-card/45 transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] flex flex-col h-24 sm:h-36 md:h-40"
              >
                {cat.icon_url ? (
                  <img
                    src={cat.icon_url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0 opacity-75 group-hover:opacity-95"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center absolute inset-0">
                    <span className="text-xl md:text-3xl font-display text-muted-foreground">
                      {cat.name.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Overlay gradient to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />

                <div className="absolute bottom-2 left-2 right-2 z-20 text-center sm:text-left">
                  <p className="font-heading font-semibold text-xs sm:text-sm md:text-base text-foreground tracking-wide line-clamp-1 group-hover:text-primary transition-colors">
                    {cat.name}
                  </p>
                </div>
              </motion.div>
            ))}
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

