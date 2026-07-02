import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import HighlightText from "./HighlightText";
import type { DeliveryItem } from "@/hooks/useDeliveryItems";

interface CategoryItemsProps {
  items: DeliveryItem[];
  categoryName: string;
  loading: boolean;
  onBack: () => void;
  highlightText?: string;
}

const CategoryItems = ({ items, categoryName, loading, onBack, highlightText = "" }: CategoryItemsProps) => {
  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-primary text-sm font-heading font-semibold mb-6 hover:underline"
      >
        <ArrowLeft size={16} /> Back to Categories
      </button>

      <h3 className="text-lg md:text-2xl font-display font-bold mb-6 neon-glow-cyan">
        {categoryName}
      </h3>

      {loading && (
        <p className="text-muted-foreground text-sm text-center py-8">Loading items...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          No items in this category yet. Please check back soon.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <img
              src={item.image_url}
              alt={item.label || "Delivery item"}
              className="w-full h-44 object-cover"
              loading="lazy"
            />
            <div className="p-3 space-y-2">
              {item.label && (
                <p className="text-sm font-heading font-semibold truncate">
                  <HighlightText text={item.label} highlight={highlightText} />
                </p>
              )}
              <WhatsAppButton imageUrl={item.image_url} className="w-full" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoryItems;
