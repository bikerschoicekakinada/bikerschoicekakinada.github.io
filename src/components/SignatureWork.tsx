import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import SwipeGallery from "./SwipeGallery";
import BeforeAfterImage from "./BeforeAfterImage";
import { DEFAULT_SIGNATURE_WORK } from "@/lib/mediaDefaults";
import { useMediaViewer, MediaItem } from "@/hooks/useMediaViewer";
import OptimizedImage from "./OptimizedImage";

type WorkItem = {
  id: string;
  image_url: string;
  label: string;
  order_index: number;
  before_image_url: string | null;
  before_image_alt: string | null;
  after_image_alt: string | null;
  before_label: string | null;
  after_label: string | null;
  comparison_enabled: boolean;
  instagram_post_url: string | null;
};

const SignatureWork = () => {
  const [dbWorks, setDbWorks] = useState<WorkItem[]>([]);
  const [hasDb, setHasDb] = useState(false);
  const { open } = useMediaViewer();

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let active = true;

    const fetchWorks = async () => {
      try {
        const { data, error } = await supabase
          .from("signature_work")
          .select("id, image_url, label, order_index, before_image_url, before_image_alt, after_image_alt, before_label, after_label, comparison_enabled, instagram_post_url")
          .order("created_at", { ascending: false });
        if (!error && active) {
          const mapped: WorkItem[] = (data || []).map((d) => ({
            id: d.id,
            image_url: d.image_url,
            label: d.label,
            order_index: d.order_index,
            before_image_url: d.before_image_url ?? null,
            before_image_alt: d.before_image_alt ?? null,
            after_image_alt: d.after_image_alt ?? null,
            before_label: d.before_label ?? null,
            after_label: d.after_label ?? null,
            comparison_enabled: d.comparison_enabled ?? false,
            instagram_post_url: d.instagram_post_url ?? null,
          }));
          setDbWorks(mapped);
          setHasDb((prev) => (mapped.length > 0 ? true : prev));
        }
      } catch (err) {
        console.error("[SignatureWork] Fetch failed:", err);
      }
    };

    fetchWorks();

    const channel = supabase
      .channel("signature-work-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signature_work" },
        () => {
          fetchWorks();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Default items with empty comparison fields
  const defaultWorks: WorkItem[] = DEFAULT_SIGNATURE_WORK.map((w, i) => ({
    id: `default-${i}`,
    image_url: w.image_url,
    label: w.label,
    order_index: w.order_index,
    before_image_url: null,
    before_image_alt: null,
    after_image_alt: null,
    before_label: null,
    after_label: null,
    comparison_enabled: false,
    instagram_post_url: null,
  }));

  const works = hasDb ? dbWorks : defaultWorks;

  const handleWorkClick = (clickedIndex: number) => {
    const mediaItems: MediaItem[] = works.map((w) => ({
      src: w.image_url,
      alt: w.label,
      instagramUrl: w.instagram_post_url,
      label: w.label,
      beforeSrc: w.before_image_url,
      beforeAlt: w.before_image_alt,
      afterAlt: w.after_image_alt,
      beforeLabel: w.before_label,
      afterLabel: w.after_label,
      comparisonEnabled: w.comparison_enabled,
    }));
    open(mediaItems, clickedIndex);
  };

  return (
    <section id="signature" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-red">
          Our Signature Custom Work
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Swipe or tap to explore our builds</p>
      </motion.div>

      <SwipeGallery
        images={works.map((w) => w.image_url)}
        renderSlide={(image, index) => {
          const work = works[index];
          const isComparison = work?.comparison_enabled && !!work?.before_image_url;

          if (isComparison) {
            return (
              <div
                className="relative rounded-xl overflow-hidden border border-border neon-border-cyan group cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".ba-handle")) return;
                  handleWorkClick(index);
                }}
              >
                <BeforeAfterImage
                  beforeSrc={work.before_image_url!}
                  afterSrc={image}
                  beforeAlt={work.before_image_alt || `${work.label} - before`}
                  afterAlt={work.after_image_alt || work.label}
                  beforeLabel={work.before_label || "Before"}
                  afterLabel={work.after_label || "After"}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pointer-events-none">
                  <span className="font-heading font-semibold text-sm text-primary">{work.label}</span>
                </div>
              </div>
            );
          }

          return (
            <div
              className="relative rounded-xl overflow-hidden border border-border neon-border-cyan group cursor-pointer"
              onClick={() => handleWorkClick(index)}
            >
              <OptimizedImage
                src={image}
                alt={work?.label || "Signature work"}
                className="transition-transform duration-500 group-hover:scale-110"
                wrapperClassName="w-full aspect-[4/5]"
                widthLimit={500}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
                <span className="font-heading font-semibold text-sm text-primary">{work?.label}</span>
              </div>
            </div>
          );
        }}
      />
    </section>
  );
};

export default SignatureWork;
