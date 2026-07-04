import { motion } from "framer-motion";
import { ArrowLeft, Phone } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import HighlightText from "./HighlightText";
import type { DeliveryItem } from "@/hooks/useDeliveryItems";
import { useMediaViewer, type MediaItem } from "@/hooks/useMediaViewer";

interface CategoryItemsProps {
  items: DeliveryItem[];
  categoryName: string;
  loading: boolean;
  onBack: () => void;
  highlightText?: string;
}

const CategoryItems = ({ items, categoryName, loading, onBack, highlightText = "" }: CategoryItemsProps) => {
  const { open } = useMediaViewer();

  const handleImageClick = (clickedIndex: number) => {
    const mediaItems: MediaItem[] = items.map((item) => ({
      src: item.image_url,
      alt: item.label || "Product image",
      label: item.label || "Product Details",
    }));
    open(mediaItems, clickedIndex);
  };

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
            className="bg-card border border-border rounded-xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="overflow-hidden aspect-video relative h-44">
                <img
                  src={item.image_url}
                  alt={item.label || "Delivery item"}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-350"
                  loading="lazy"
                  onClick={() => handleImageClick(index)}
                />
              </div>
              <div className="p-3">
                {item.label && (
                  <p className="text-sm font-heading font-semibold truncate text-foreground">
                    <HighlightText text={item.label} highlight={highlightText} />
                  </p>
                )}
              </div>
            </div>
            <div className="p-3 pt-0 flex flex-col gap-2">
              <WhatsAppButton imageUrl={item.image_url} itemLabel={item.label ?? undefined} className="w-full" />
              <a
                href="tel:+918523876978"
                className="flex items-center justify-center gap-1.5 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 font-heading font-semibold py-2 px-4 rounded-full text-xs transition-colors w-full"
              >
                <Phone size={13} /> Call Now
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoryItems;
