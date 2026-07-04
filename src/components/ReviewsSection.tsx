import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2 } from "lucide-react";

interface Testimonial {
  name: string;
  bike: string;
  rating: number;
  text: string;
}

const reviews: Testimonial[] = [
  {
    name: "Ravi Kumar",
    bike: "Yamaha R15 V4",
    rating: 5,
    text: "Incredible custom paint job on my R15. The finish quality is showroom level. Best custom shop in Kakinada!",
  },
  {
    name: "Sai Teja",
    bike: "KTM Duke 390",
    rating: 5,
    text: "Got full LED underglow and headlight upgrade. The bike looks completely transformed. Professional work and great pricing.",
  },
  {
    name: "Anil Reddy",
    bike: "Royal Enfield Classic",
    rating: 5,
    text: "Best helmet collection in the region. Ordered an Axor helmet online, received it in 3 days with perfect packing.",
  },
  {
    name: "Prasad",
    bike: "Apache RTR 200",
    rating: 4,
    text: "Got my bike wrapped with a matte black finish. Clean work, no bubbles, looks absolutely premium. Highly recommended.",
  },
  {
    name: "Venkat",
    bike: "Dominar 400",
    rating: 5,
    text: "Ordered riding gloves and a phone mount via WhatsApp. Stock confirmed instantly, delivered within 2 days. Genuine products!",
  },
];

const ReviewsSection = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % reviews.length);
  const prev = () => setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);

  const review = reviews[current];

  return (
    <section className="py-16 px-4 bg-surface/30 border-t border-border/10" id="reviews">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">
          What Riders Say
        </h2>
        <p className="text-center text-xs text-muted-foreground uppercase font-heading tracking-widest mb-8">
          Verified Reviews from our Community
        </p>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card/40 border border-border/30 rounded-xl p-6 md:p-8 relative"
            >
              <Quote size={32} className="text-primary/10 absolute top-4 left-4" />

              <p className="text-sm md:text-base text-foreground leading-relaxed mb-6 font-body pt-4">
                "{review.text}"
              </p>

              <div className="flex items-center justify-between border-t border-border/10 pt-4">
                <div>
                  <p className="text-sm font-heading font-bold text-foreground flex items-center gap-1">
                    {review.name}
                    <CheckCircle2 size={13} className="text-primary fill-primary/10" />
                  </p>
                  <p className="text-xs text-muted-foreground">{review.bike}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-border"
                      }
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex gap-1.5">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === current ? "bg-primary w-3" : "bg-border"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ReviewsSection;
