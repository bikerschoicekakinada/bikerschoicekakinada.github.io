import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Instagram, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import Seo from "@/components/Seo";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_GALLERY_CATEGORIES, DEFAULT_GALLERY_IMAGES } from "@/lib/mediaDefaults";

type GalleryItem = {
  id: string;
  src: string;
  cat: string;
  before_image_url: string | null;
  comparison_enabled: boolean;
  instagram_post_url: string | null;
  label: string;
  compatible_bikes: string[];
};

// ─── Before/After Image Comparison Slider ────────────────────────────────────
interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  displayName: string;
}

const ComparisonSlider = ({ beforeUrl, afterUrl, displayName }: ComparisonSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  // Smooth intro animation from 100 to 50
  useEffect(() => {
    const start = Date.now();
    const duration = 800; // 0.8 seconds
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setSliderPosition(100 - ease * 50); // goes from 100 to 50
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const timeout = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 400); // short delay after loading
    
    return () => clearTimeout(timeout);
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1 || isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      className="relative w-full h-full select-none overflow-hidden bg-black flex items-center justify-center cursor-ew-resize"
    >
      {/* Before Image (Left side / Background) */}
      <img
        src={beforeUrl}
        alt={`${displayName} before`}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 z-10 pointer-events-none">
        Before
      </div>

      {/* After Image (Right side / Clipped) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img
          src={afterUrl}
          alt={`${displayName} after`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      </div>
      <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow z-10 pointer-events-none">
        After
      </div>

      {/* Slider Line & Handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-xl z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-2xl flex items-center justify-center border border-neutral-300 pointer-events-none">
          <span className="text-[10px] font-bold">↔</span>
        </div>
      </div>
    </div>
  );
};

// ─── Lightbox Modal Component (Rich Slide Show & Reels) ────────────────────────
interface LightboxProps {
  item: GalleryItem;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox = ({ item, onClose, onNext, onPrev }: LightboxProps) => {
  const [showRipple, setShowRipple] = useState(false);

  // Reset ripple state when item changes
  useEffect(() => {
    setShowRipple(false);
  }, [item.id]);

  // Show ripple/vibration effect on the watch reel button after 3 seconds
  useEffect(() => {
    if (!item.instagram_post_url) return;

    const timer = setTimeout(() => {
      setShowRipple(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [item.instagram_post_url]);

  const displayName = `${item.cat} Modification`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 md:p-6"
    >
      {/* Dynamic inline styles for water ripple effect */}
      <style>{`
        @keyframes ripple-water {
          0% {
            box-shadow: 0 0 0 0 rgba(238, 42, 123, 0.7), 0 0 0 0 rgba(98, 40, 215, 0.5);
          }
          100% {
            box-shadow: 0 0 0 16px rgba(238, 42, 123, 0), 0 0 0 32px rgba(98, 40, 215, 0);
          }
        }
        .water-ripple-vibrate {
          animation: ripple-water 1.2s infinite !important;
        }
      `}</style>

      {/* Lightbox Header */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-cyan-400 font-heading font-black text-sm md:text-base leading-tight">
            {displayName}
          </h2>
          <span className="text-[10px] bg-primary text-primary-foreground font-heading font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
            {item.cat}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-lg md:max-w-2xl flex-1 flex items-center justify-center relative my-4">
        {/* Navigation Arrows */}
        <button
          onClick={onPrev}
          className="absolute -left-2 md:-left-16 z-20 text-white/50 hover:text-white bg-black/40 hover:bg-black/60 p-3 rounded-full transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={onNext}
          className="absolute -right-2 md:-right-16 z-20 text-white/50 hover:text-white bg-black/40 hover:bg-black/60 p-3 rounded-full transition-all"
        >
          <ChevronRight size={24} />
        </button>

        {/* Photo wrapper */}
        <div className="w-full max-h-[72vh] aspect-[4/5] rounded-2xl overflow-hidden relative border border-white/15 bg-neutral-900 shadow-2xl">
          {/* Main Photo / Before-After Split Image Slider */}
          <div className="w-full h-full relative select-none flex items-center justify-center bg-black">
            {item.before_image_url ? (
              <ComparisonSlider
                beforeUrl={item.before_image_url}
                afterUrl={item.src}
                displayName={displayName}
              />
            ) : (
              <img
                src={item.src}
                alt={displayName}
                className="w-full h-full object-cover pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Footer Actions */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 z-10">
        <div className="flex gap-2 w-full sm:w-auto">
          {item.instagram_post_url ? (
            <button
              onClick={() => {
                if (item.instagram_post_url) {
                  window.open(item.instagram_post_url, "_blank");
                }
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-95 text-white font-heading font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md ${
                showRipple ? "water-ripple-vibrate" : ""
              }`}
            >
              <Instagram size={14} /> Watch Reel & Review
            </button>
          ) : null}

          <a
            href={`https://wa.me/918523876978?text=${encodeURIComponent(
              `Hi Bikers Choice Kakinada, I saw this custom ${displayName} on your showcase and wanted to enquire!\n\nImage: ${item.src}\nGallery Link: ${window.location.origin}/galleryphotos`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-heading font-bold transition-all shadow-md"
          >
            <MessageCircle size={14} /> WhatsApp Enquiry
          </a>

          <a
            href="tel:+918523876978"
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-heading font-bold transition-all shadow-md"
          >
            <Phone size={14} /> Call Us
          </a>
        </div>

        <p className="text-[10px] text-white/40 font-heading">
          Cycle photos using arrow keys or tap side arrows
        </p>
      </div>
    </motion.div>
  );
};

// ─── Main Gallery Showcase Page ──────────────────────────────────────────────
export default function GalleryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("category") || "All";

  const [filter, setFilter] = useState(catParam);
  const [dbImages, setDbImages] = useState<GalleryItem[]>([]);
  const [hasDb, setHasDb] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All", ...DEFAULT_GALLERY_CATEGORIES]);
  const [loading, setLoading] = useState(true);

  // Grid Columns State (1 to 6 columns)
  const [columns, setColumns] = useState(3);

  // Lazy Loading / Infinite Scroll State (Loads 20 images at a time)
  const [visibleCount, setVisibleCount] = useState(20);

  // Lightbox Selected Item State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Pinch Gesture tracking ref
  const touchStartDist = useRef<number | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const defaultImages: GalleryItem[] = DEFAULT_GALLERY_IMAGES.map((img, index) => ({
    id: `fallback-${index}`,
    src: img.src,
    cat: img.cat,
    before_image_url: null,
    comparison_enabled: false,
    instagram_post_url: (img as { instagram_post_url?: string }).instagram_post_url ?? null,
    label: (img as { label?: string }).label ?? `${img.cat} Custom Design`,
    compatible_bikes: (img as { compatible_bikes?: string[] }).compatible_bikes ?? [],
  }));

  const images = hasDb ? dbImages : defaultImages;

  // Extract unique suggestion candidates based on labels and compatible bikes
  const getSuggestionsList = useCallback(() => {
    const allBikes = new Set<string>();
    images.forEach((img) => {
      if (img.compatible_bikes) {
        img.compatible_bikes.forEach((bike) => {
          if (bike) allBikes.add(bike);
        });
      }
      if (img.label) {
        allBikes.add(img.label);
        const words = img.label.split(/\s+/).filter((w) => w.length > 2);
        words.forEach((w) => allBikes.add(w));
      }
    });
    return Array.from(allBikes);
  }, [images]);

  // Update autocomplete suggestions list
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const candidates = getSuggestionsList();

    const matched = candidates
      .filter((name) => name.toLowerCase().includes(query) && name.toLowerCase() !== query)
      .sort((a, b) => {
        const aPref = a.toLowerCase().startsWith(query);
        const bPref = b.toLowerCase().startsWith(query);
        if (aPref && !bPref) return -1;
        if (!aPref && bPref) return 1;
        return a.length - b.length;
      })
      .slice(0, 3); // top 3 suggestions

    setSuggestions(matched);
  }, [searchQuery, getSuggestionsList]);

  // Click away listener for suggestion box
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getFilteredAndSortedImages = () => {
    const baseList = filter === "All" ? images : images.filter((img) => img.cat === filter);
    if (!searchQuery.trim()) return baseList;

    const query = searchQuery.toLowerCase().trim();

    return baseList
      .map((img) => {
        let score = 0;
        const imgLabel = (img.label || "").toLowerCase();
        const bikes = (img.compatible_bikes || []).map((b) => b.toLowerCase());

        // 1. Exact match on compatible bike: +1000 points
        if (bikes.includes(query)) {
          score += 1000;
        }

        // 2. Exact match on label: +500 points
        if (imgLabel === query) {
          score += 500;
        }

        // 3. Partial inclusion match on compatible bikes: +150 points
        bikes.forEach((b) => {
          if (b.includes(query) || query.includes(b)) {
            score += 150;
          }
        });

        // 4. Partial inclusion match on label: +100 points
        if (imgLabel.includes(query)) {
          score += 100;
        }

        // 5. Category matches: +50 points
        if (img.cat.toLowerCase().includes(query)) {
          score += 50;
        }

        return { item: img, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  };

  const filteredImages = getFilteredAndSortedImages();



  // Sync state filter with URL parameters
  useEffect(() => {
    setFilter(catParam);
    setVisibleCount(20); // Reset page load count when category filter shifts
  }, [catParam]);

  // Supabase Data Sync
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from("gallery_categories")
          .select("name")
          .order("order_index");

        if (data && data.length > 0 && active) {
          setCategories(["All", ...data.map((c) => c.name)]);
        }
      } catch (err) {
        console.error("[GalleryPage] Categories load failed:", err);
      }
    };

    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && active) {
          const mapped: GalleryItem[] = (data || []).map((d) => ({
            id: d.id,
            src: d.image_url,
            cat: d.category,
            before_image_url: d.before_image_url ?? null,
            comparison_enabled: d.comparison_enabled ?? false,
            instagram_post_url: d.instagram_post_url ?? null,
            label: d.label ?? "",
            compatible_bikes: d.compatible_bikes ?? [],
          }));
          setDbImages(mapped);
          if (mapped.length > 0) setHasDb(true);
        }
      } catch (err) {
        console.error("[GalleryPage] Images load failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategories();
    fetchImages();

    return () => {
      active = false;
    };
  }, []);

  // Auto-open lightbox if "?id=..." is in the URL
  useEffect(() => {
    if (loading || images.length === 0) return;
    const idParam = searchParams.get("id");
    if (idParam) {
      const idx = images.findIndex((img) => img.id === idParam);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }
  }, [searchParams, images, loading]);

  // Infinite Scroll Trigger using IntersectionObserver
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 20, filteredImages.length));
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loading, visibleCount, filter, filteredImages.length]);

  // Touch listener to handle pinch gestures to change columns count (zoom in/out)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const delta = currentDist - touchStartDist.current;
      
      // Threshold to trigger column resizing
      if (Math.abs(delta) > 50) {
        if (delta > 0) {
          // Zoom In: Spreading fingers -> make photos larger -> decrease column count
          setColumns((prev) => Math.max(1, prev - 1));
        } else {
          // Zoom Out: Pinching fingers -> make photos smaller -> increase column count
          setColumns((prev) => Math.min(6, prev + 1));
        }
        // Reset anchor point to prevent double-resizing
        touchStartDist.current = currentDist;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
  };

  // Keyboard navigation for Lightbox slideshow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1));
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredImages.length]);

  // Slice list based on visibleCount for infinite scroll
  const loadedImages = filteredImages.slice(0, visibleCount);

  // Map columns count to tailwind grid-cols class names
  const gridColumnClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  }[columns as 1 | 2 | 3 | 4 | 5 | 6] || "grid-cols-3";

  return (
    <div className="min-h-screen bg-background select-none">
      <Seo
        title="Custom Work Gallery | Bikers Choice Kakinada"
        description="Explore our portfolio of premium bike modifications, lighting enhancements, custom paintings, hydro dipping, and wraps in Kakinada."
        canonical="https://bikerschoicekakinada.vercel.app/galleryphotos"
      />

      <Navbar />

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs text-primary font-heading font-semibold hover:underline mb-2"
            >
              <ArrowLeft size={14} /> Back to Home
            </button>
            <h1 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-wider text-foreground">
              Modification Showcase
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Tap any photo to view in fullscreen. Pinch-to-zoom (spread fingers) or use the floating control to adjust grid photo sizes.
            </p>
          </div>
        </div>

        {/* Search Engine Bar */}
        <div ref={searchRef} className="relative max-w-md mx-auto w-full">
          <div className="flex bg-muted/60 border border-border/80 rounded-2xl px-4 py-2.5 items-center gap-2 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <span className="text-muted-foreground">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search custom bikes (e.g. Duke, R15, Himalayan)..."
              className="w-full bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                }}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Box */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/80 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-border/30 backdrop-blur-md">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{sug}</span>
                  <span className="text-[10px] text-muted-foreground/60">Tap to search</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories Tab Selector */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-border/10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilter(cat);
                navigate(`/galleryphotos?category=${encodeURIComponent(cat)}`, { replace: true });
              }}
              className={`px-4 py-2 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-colors border ${
                filter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid (with Pinch Zoom gestures on Mobile) */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-card/20 border border-border/40 rounded-xl p-2 space-y-2 animate-pulse">
                <div className="aspect-[4/5] bg-muted/45 rounded-lg w-full" />
                <div className="h-4 bg-muted/45 rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`grid ${gridColumnClass} gap-4 transition-all duration-300`}
          >
            {loadedImages.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border/50 rounded-xl p-2 flex flex-col justify-between hover:border-primary/40 cursor-pointer shadow aspect-[4/5] group overflow-hidden relative"
                onClick={() => setSelectedIndex(idx)}
              >
                <img
                  src={item.src}
                  alt={`${item.cat} custom build`}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Name Overlay (Shows name only, other details hidden until click) */}
                <div className="absolute inset-x-2 bottom-2 bg-black/70 backdrop-blur-sm py-2 px-3 rounded-lg text-center border border-white/5 transition-opacity duration-300">
                  <p className="text-[10px] sm:text-xs font-heading font-black text-cyan-400 truncate uppercase tracking-wide">
                    {item.label || "Custom Modification"}
                  </p>
                </div>

                {/* Watch Reel Indicator Badge */}
                {item.instagram_post_url && (
                  <div className="absolute top-4 right-4 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1">
                    <Instagram size={8} /> Watch
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Scroll Intersection Loader Target */}
        <div ref={loaderRef} className="h-10 w-full flex items-center justify-center py-8">
          {!loading && visibleCount < filteredImages.length && (
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-100" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-300" />
            </div>
          )}
        </div>

        {!loading && filteredImages.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-sm text-muted-foreground font-semibold">No custom projects found under this category.</p>
            <button
              onClick={() => {
                setFilter("All");
                navigate("/galleryphotos?category=All", { replace: true });
              }}
              className="text-xs text-primary font-heading font-bold underline"
            >
              Show all categories
            </button>
          </div>
        )}
      </main>

      {/* Floating Zoom / Grid Columns Control panel */}
      <div className="fixed bottom-6 right-6 z-40 bg-card border border-border/80 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur">
        <button
          onClick={() => setColumns((prev) => Math.min(6, prev + 1))}
          className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all"
          title="Zoom Out (More columns, smaller photos)"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-[10px] font-heading font-bold text-muted-foreground uppercase select-none whitespace-nowrap">
          {columns} Columns
        </span>
        <button
          onClick={() => setColumns((prev) => Math.max(1, prev - 1))}
          className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all"
          title="Zoom In (Fewer columns, larger photos)"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <Lightbox
            item={filteredImages[selectedIndex]}
            onClose={() => setSelectedIndex(null)}
            onNext={() =>
              setSelectedIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0))
            }
            onPrev={() =>
              setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1))
            }
          />
        )}
      </AnimatePresence>

      <FooterSection />
    </div>
  );
}
