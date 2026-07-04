import { motion } from "framer-motion";

const brands = [
  { name: "Axor", letter: "AX" },
  { name: "SMK", letter: "SMK" },
  { name: "MT Helmets", letter: "MT" },
  { name: "Steelbird", letter: "SB" },
  { name: "Vega", letter: "VG" },
  { name: "Royal Enfield", letter: "RE" },
  { name: "Yamaha", letter: "YA" },
  { name: "KTM", letter: "KTM" },
  { name: "TVS", letter: "TVS" },
  { name: "Studds", letter: "ST" },
];

const BrandsBanner = () => {
  // Double the list to create a seamless infinite scroll
  const doubled = [...brands, ...brands, ...brands];

  return (
    <section className="py-10 px-4 bg-background overflow-hidden border-t border-border/10">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-center text-[10px] md:text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground mb-6">
          Premium Brands We Carry
        </p>
      </motion.div>

      <div className="relative w-full overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

        <div
          className="flex gap-6 animate-marquee"
          style={{ width: "max-content" }}
        >
          {doubled.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="flex-shrink-0 flex items-center justify-center w-24 h-12 bg-card/30 border border-border/20 rounded-lg hover:border-primary/30 transition-colors duration-300"
              title={brand.name}
            >
              <span className="text-xs md:text-sm font-display font-extrabold text-muted-foreground/60 tracking-wider select-none">
                {brand.letter}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsBanner;
