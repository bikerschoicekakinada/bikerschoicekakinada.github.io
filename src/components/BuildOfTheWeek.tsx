import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Instagram, Wrench } from "lucide-react";
import BeforeAfterImage from "./BeforeAfterImage";

type FeaturedBuild = {
  id: string;
  label: string;
  image_url: string;
  before_image_url: string;
  before_image_alt: string | null;
  after_image_alt: string | null;
  before_label: string | null;
  after_label: string | null;
  instagram_post_url: string | null;
};

const BuildOfTheWeek = () => {
  const [build, setBuild] = useState<FeaturedBuild | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from("signature_work")
          .select("*")
          .eq("comparison_enabled", true)
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.before_image_url) {
          setBuild({
            id: data.id,
            label: data.label,
            image_url: data.image_url,
            before_image_url: data.before_image_url,
            before_image_alt: data.before_image_alt ?? null,
            after_image_alt: data.after_image_alt ?? null,
            before_label: data.before_label ?? null,
            after_label: data.after_label ?? null,
            instagram_post_url: data.instagram_post_url ?? null,
          });
        }
      } catch (err) {
        console.error("[BuildOfTheWeek] Fetch failed:", err);
      }
    };

    fetchFeatured();
  }, []);

  if (!build) return null;

  return (
    <section className="py-14 px-4 bg-background border-t border-border/20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench size={18} className="text-secondary" />
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-secondary">
            Build of the Week
          </span>
        </div>

        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-6 neon-glow-red">
          {build.label}
        </h2>

        <div className="rounded-xl overflow-hidden border border-border neon-border-cyan mb-6">
          <BeforeAfterImage
            beforeSrc={build.before_image_url}
            afterSrc={build.image_url}
            beforeAlt={build.before_image_alt || `${build.label} - before`}
            afterAlt={build.after_image_alt || build.label}
            beforeLabel={build.before_label || "Before"}
            afterLabel={build.after_label || "After"}
          />
        </div>

        {build.instagram_post_url && (
          <div className="flex justify-center">
            <a
              href={build.instagram_post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 font-heading font-semibold py-2.5 px-5 rounded-full text-sm hover:bg-purple-600 hover:text-white transition-colors"
            >
              <Instagram size={16} /> Watch Installation Reel
            </a>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default BuildOfTheWeek;
