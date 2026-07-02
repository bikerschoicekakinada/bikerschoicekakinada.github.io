import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_GALLERY_CATEGORIES, DEFAULT_GALLERY_IMAGES } from "@/lib/mediaDefaults";
import { useMediaViewer, MediaItem } from "@/hooks/useMediaViewer";

type DbGalleryImage = {
  src: string;
  cat: string;
  before_image_url: string | null;
  before_image_alt: string | null;
  after_image_alt: string | null;
  before_label: string | null;
  after_label: string | null;
  comparison_enabled: boolean;
  instagram_post_url: string | null;
};

const GallerySection = () => {
  const [filter, setFilter] = useState("All");
  const [dbImages, setDbImages] = useState<DbGalleryImage[]>([]);
  const [hasDb, setHasDb] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All", ...DEFAULT_GALLERY_CATEGORIES]);
  const { open } = useMediaViewer();

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let active = true;

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("gallery_categories")
          .select("name, order_index")
          .order("order_index");

        if (!error && data && data.length > 0 && active) {
          const dbCats = data.map((c) => c.name);
          setCategories(["All", ...dbCats]);
        }
        // If error (table doesn't exist yet) or empty, keep defaults
      } catch {
        // Table doesn't exist on remote — keep defaults
      }
    };

    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.from("gallery").select("*").order("order_index");
        if (!error && active) {
          const mapped: DbGalleryImage[] = (data || []).map((d) => ({
            src: d.image_url,
            cat: d.category,
            before_image_url: d.before_image_url ?? null,
            before_image_alt: d.before_image_alt ?? null,
            after_image_alt: d.after_image_alt ?? null,
            before_label: d.before_label ?? null,
            after_label: d.after_label ?? null,
            comparison_enabled: d.comparison_enabled ?? false,
            instagram_post_url: d.instagram_post_url ?? null,
          }));
          setDbImages(mapped);
          setHasDb((prev) => (mapped.length > 0 ? true : prev));
        }
      } catch (err) {
        console.error("[GallerySection] Fetch failed:", err);
      }
    };

    fetchCategories();
    fetchImages();

    // Realtime subscription for gallery images
    const galleryChannel = supabase
      .channel("gallery-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery" },
        () => {
          fetchImages();
        }
      )
      .subscribe();

    // Realtime subscription for gallery categories
    const catChannel = supabase
      .channel("gallery-categories-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_categories" },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(galleryChannel);
      supabase.removeChannel(catChannel);
    };
  }, []);

  // Default fallback images
  const defaultImages: DbGalleryImage[] = DEFAULT_GALLERY_IMAGES.map((img) => ({
    src: img.src,
    cat: img.cat,
    before_image_url: null,
    before_image_alt: null,
    after_image_alt: null,
    before_label: null,
    after_label: null,
    comparison_enabled: false,
    instagram_post_url: null,
  }));

  const images = hasDb ? dbImages : defaultImages;
  const filtered = filter === "All" ? images : images.filter((img) => img.cat === filter);

  // Gallery grid on the page always shows exactly 2 items for the selected tab
  const displayItems = filtered.slice(0, 2);

  const handleImageClick = (clickedIndex: number) => {
    // Map from the full list of filtered items so all category photos are accessible in the viewer
    const mediaItems: MediaItem[] = filtered.map((img) => ({
      src: img.src,
      alt: `${img.cat} bike modification by Bikers Choice Kakinada`,
      instagramUrl: img.instagram_post_url,
      label: `${img.cat} - Custom Modification`,
      beforeSrc: img.before_image_url,
      beforeAlt: img.before_image_alt,
      afterAlt: img.after_image_alt,
      beforeLabel: img.before_label,
      afterLabel: img.after_label,
      comparisonEnabled: img.comparison_enabled,
    }));

    open(mediaItems, clickedIndex);
  };

  return (
    <section id="gallery" className="py-16 px-4 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-6 neon-glow-red">
          Gallery
        </h2>
      </motion.div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 pb-2 justify-start md:justify-center max-w-5xl mx-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-colors ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid layout - Always locked to 2 columns and 2 items */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto px-2">
        {displayItems.map((item, index) => {
          const showMoreOverlay = index === 1 && filtered.length > 2;

          return (
            <div
              key={`${item.src}-${index}`}
              onClick={() => handleImageClick(index)}
              className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/50 hover:border-primary transition-all duration-300 shadow aspect-[4/5]"
            >
              <img
                src={item.src}
                alt={`${item.cat} modification`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Badges overlay */}
              {!showMoreOverlay && (
                <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
                  {item.comparison_enabled && (
                    <span className="bg-primary text-primary-foreground text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-md">
                      B/A
                    </span>
                  )}
                  {item.instagram_post_url && (
                    <span className="bg-purple-600 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-md">
                      Reel
                    </span>
                  )}
                </div>
              )}

              {/* "+N More" overlay indicator */}
              {showMoreOverlay && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center transition-colors group-hover:bg-background/70">
                  <span className="text-primary font-display font-extrabold text-lg md:text-xl">
                    +{filtered.length - 2} More
                  </span>
                  <span className="text-muted-foreground font-heading font-semibold text-[10px] uppercase tracking-wider">
                    Tap to View
                  </span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">
          No images available in this category.
        </p>
      )}
    </section>
  );
};

export default GallerySection;
