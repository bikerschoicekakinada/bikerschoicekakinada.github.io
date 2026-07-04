import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Phone,
  X,
  ChevronRight,
} from "lucide-react";
import { useDeliveryCategories } from "@/hooks/useDeliveryCategories";
import { useDeliveryItems, type DeliveryItem } from "@/hooks/useDeliveryItems";
import { useDeliverySubcategories } from "@/hooks/useDeliverySubcategories";
import { useSmartProductSearch } from "@/hooks/useSmartProductSearch";
import WhatsAppButton from "@/components/WhatsAppButton";
import HighlightText from "@/components/HighlightText";
import type { SearchSuggestion } from "@/lib/searchEngine";

// ─── Skeleton loader ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-card/40 border border-border/55 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-video bg-muted/45 h-40 sm:h-48" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-muted/45 rounded w-2/3" />
      <div className="h-3 bg-muted/35 rounded w-1/2" />
    </div>
  </div>
);

// ─── Product Card Component ────────────────────────────────────────────────
interface ProductCardProps {
  item: DeliveryItem;
  index: number;
  highlightText?: string;
}

const ProductCard = ({ item, index, highlightText = "" }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="bg-card/35 border border-border/60 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all duration-300 group shadow-md"
    >
      <div>
        <div className="overflow-hidden h-40 sm:h-48 relative bg-muted/20">
          <img
            src={item.image_url}
            alt={item.label || "Product"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-4 space-y-2">
          <h4 className="text-sm sm:text-base font-heading font-bold text-cyan-400 line-clamp-2 group-hover:text-primary transition-colors">
            <HighlightText text={item.label} highlight={highlightText} />
          </h4>
          
          {/* Compatibility tags */}
          {item.compatible_bikes && item.compatible_bikes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {item.compatible_bikes.map((bike: string) => (
                <span
                  key={bike}
                  className="text-[9px] font-heading font-bold bg-muted border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground"
                >
                  {bike}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons directly on the card */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-border/10 mt-2">
        <WhatsAppButton
          imageUrl={item.image_url}
          itemLabel={item.label}
          className="w-full py-2.5 font-bold text-xs"
        />
        <a
          href="tel:+918523876978"
          className="flex items-center justify-center gap-1 bg-card border border-border hover:border-primary/50 text-foreground font-heading font-bold py-2.5 px-3 rounded-full text-xs transition-colors w-full"
        >
          <Phone size={13} /> Call
        </a>
      </div>
    </motion.div>
  );
};

// ─── Main Products Explorer Page ─────────────────────────────────────────────
const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation Parameters from URL
  const catParam = searchParams.get("cat");
  const subcatParam = searchParams.get("subcat");
  const queryParam = searchParams.get("q") || "";

  // Local/URL synced search inputs
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [debouncedSearch, setDebouncedSearch] = useState(queryParam);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Supabase hooks
  const { categories, loading: catsLoading, usingFallback } = useDeliveryCategories();
  const { subcategories, loading: subcatsLoading } = useDeliverySubcategories(catParam);
  const { items, loading: itemsLoading } = useDeliveryItems(catParam, usingFallback, subcatParam);
  const { allItems, searchResults, suggestions, search, loading: searchLoading } =
    useSmartProductSearch(categories, usingFallback);

  // Active navigation objects derived from parameters
  const selectedCategory = useMemo(() => categories.find((c) => c.id === catParam) || null, [categories, catParam]);
  const selectedSubcategory = useMemo(() => subcategories.find((s) => s.id === subcatParam) || null, [subcategories, subcatParam]);

  // Debounce search input changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Trigger fuzzy matches when debounced search term or scoped category changes
  useEffect(() => {
    search(debouncedSearch, catParam);
  }, [debouncedSearch, catParam, search]);

  // Synchronize URL search parameters on changes
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (catParam) params.cat = catParam;
    if (subcatParam) params.subcat = subcatParam;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, catParam, subcatParam, setSearchParams]);

  // Helper: Count items dynamically under Category or Subcategory
  const getSubcategoryCount = useCallback(
    (subcatId: string) => allItems.filter((item) => item.subcategory_id === subcatId && item.visibility !== false).length,
    [allItems]
  );

  const getCategoryCount = useCallback(
    (categoryId: string) => allItems.filter((item) => item.category_id === categoryId && item.visibility !== false).length,
    [allItems]
  );

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "category" && suggestion.categoryName) {
      const foundCat = categories.find(
        (c) => c.name.toLowerCase() === suggestion.categoryName?.toLowerCase()
      );
      if (foundCat) {
        navigate(`/products?cat=${foundCat.id}`);
        handleClearSearch();
        return;
      }
    }
    setSearchTerm(suggestion.text);
    setDebouncedSearch(suggestion.text);
    setShowSuggestions(false);
  };

  const isSearching = debouncedSearch.trim().length > 0;
  const showLoading = itemsLoading || (isSearching && searchLoading) || catsLoading;

  // ─── Breadcrumb Navigation ────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 mb-6 flex-wrap font-heading">
      <button onClick={() => navigate("/")} className="hover:text-primary transition-colors font-semibold">
        Home
      </button>
      <ChevronRight size={10} />
      <button
        onClick={() => {
          navigate("/products");
          handleClearSearch();
        }}
        className={`font-semibold transition-colors ${!selectedCategory ? "text-primary font-bold" : "hover:text-primary"}`}
      >
        Products
      </button>
      {selectedCategory && (
        <>
          <ChevronRight size={10} />
          <button
            onClick={() => navigate(`/products?cat=${selectedCategory.id}`)}
            className={`font-semibold transition-colors ${!selectedSubcategory ? "text-primary font-bold" : "hover:text-primary"}`}
          >
            {selectedCategory.name}
          </button>
        </>
      )}
      {selectedSubcategory && (
        <>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold font-bold max-w-[120px] truncate">
            {selectedSubcategory.name}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ── Sticky Navigation Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => {
                if (selectedSubcategory) {
                  navigate(`/products?cat=${selectedCategory?.id}`);
                } else if (selectedCategory) {
                  navigate("/products");
                } else {
                  navigate("/");
                }
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card/40 hover:text-foreground transition-colors shrink-0"
              aria-label="Back button"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Smart Search Bar with suggestions */}
            <div className="flex-1 relative" onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}>
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search accessories, compatibility, brands..."
                className="w-full bg-muted/40 border border-border/70 focus:border-primary/80 focus:ring-1 focus:ring-primary/20 rounded-full pl-9 pr-9 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/75 focus:outline-none transition-all font-heading font-medium"
                aria-label="Search Catalog"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/70 transition-colors"
                  aria-label="Clear query input"
                >
                  <X size={14} />
                </button>
              )}

              {/* Autocomplete Suggestions Box */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 bg-card border border-border/70 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-border/20"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.text}-${i}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(s);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/65 transition-colors text-xs font-heading font-semibold"
                      >
                        <Search size={13} className="text-muted-foreground shrink-0" />
                        <span className="truncate text-foreground/90">{s.text}</span>
                        {s.type === "category" && (
                          <span className="text-[9px] uppercase tracking-wider text-primary ml-auto font-bold shrink-0">
                            Category
                          </span>
                        )}
                        {s.type === "brand" && (
                          <span className="text-[9px] uppercase tracking-wider text-secondary ml-auto font-bold shrink-0">
                            Brand
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main View Container ─────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumb />

        {/* ── 1. ACTIVE SEARCH MATCHES VIEW ────────────────────────────── */}
        {isSearching && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm sm:text-base font-display font-bold text-foreground">
                {searchLoading
                  ? "Searching…"
                  : `${searchResults.length} product${searchResults.length !== 1 ? "s" : ""} found for "${debouncedSearch}"`}
              </h2>
              <button
                onClick={handleClearSearch}
                className="text-xs text-primary hover:underline font-heading font-bold"
              >
                Clear Search
              </button>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                  <Search size={22} />
                </div>
                <h3 className="text-base font-heading font-bold mb-1">No matching products</h3>
                <p className="text-xs text-muted-foreground mb-4">Try checking spelling or search general keywords.</p>
                <button onClick={handleClearSearch} className="text-xs text-primary hover:underline font-bold">
                  Browse catalog categories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {searchResults.map((item, i) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={i}
                    highlightText={debouncedSearch}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 2. MAIN CATEGORIES GRID VIEW ────────────────────────────── */}
        {!isSearching && !selectedCategory && (
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-1 neon-glow-cyan">
              Product Categories
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mb-8">
              Explore our structured motorcycle catalogs. Enquire or order directly via WhatsApp.
            </p>

            {showLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categories.map((cat, index) => {
                  const count = getCategoryCount(cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      onClick={() => navigate(`/products?cat=${cat.id}`)}
                      className="group bg-card/35 border border-border/60 rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300 text-left flex flex-col justify-between"
                    >
                      <div>
                        {cat.icon_url ? (
                          <div className="aspect-video h-32 sm:h-36 overflow-hidden">
                            <img
                              src={cat.icon_url}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 sm:h-36 bg-muted/40 flex items-center justify-center">
                            <span className="text-3xl font-display text-muted-foreground">
                              {cat.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 pt-0 text-[10px] text-primary/80 font-heading font-bold flex justify-between items-center border-t border-border/10 mt-2">
                        <span>{count} Products</span>
                        <span className="group-hover:translate-x-1 transition-transform">Browse →</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 3. MAIN CATEGORY PAGE (ONLY SUBCATEGORY CARDS) ──────────── */}
        {!isSearching && selectedCategory && !selectedSubcategory && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-display font-bold neon-glow-cyan">
                {selectedCategory.name}
              </h2>
              {selectedCategory.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">{selectedCategory.description}</p>
              )}
            </div>

            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-1.5 text-primary text-xs font-heading font-bold mb-6 hover:underline"
            >
              <ArrowLeft size={13} /> Back to Categories
            </button>

            {subcatsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : subcategories.length === 0 ? (
              // Fallback: If Category has no subcategories, render products directly
              items.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground text-sm font-semibold">
                  No products in this category yet. Please check back soon.
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item, i) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      index={i}
                    />
                  ))}
                </div>
              )
            ) : (
              // Structured View: Render only Subcategory cards
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {subcategories.map((sub, index) => {
                  const count = getSubcategoryCount(sub.id);
                  return (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      onClick={() => navigate(`/products?cat=${selectedCategory.id}&subcat=${sub.id}`)}
                      className="group bg-card/35 border border-border/60 rounded-2xl overflow-hidden hover:border-primary/65 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300 text-left flex flex-col justify-between"
                    >
                      <div>
                        {sub.cover_image_url ? (
                          <div className="aspect-video h-32 sm:h-36 overflow-hidden">
                            <img
                              src={sub.cover_image_url}
                              alt={sub.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 sm:h-36 bg-muted/40 flex items-center justify-center">
                            <span className="text-3xl font-display text-muted-foreground">
                              {sub.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {sub.name}
                          </p>
                          {sub.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 pt-0 text-[10px] text-primary/80 font-heading font-bold flex justify-between items-center border-t border-border/10 mt-2">
                        <span>{count} Products</span>
                        <span className="group-hover:translate-x-1 transition-transform">Browse →</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 4. SUBCATEGORY PRODUCTS PAGE (PRODUCT LIST) ──────────────── */}
        {!isSearching && selectedCategory && selectedSubcategory && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-display font-bold neon-glow-cyan">
                {selectedSubcategory.name}
              </h2>
              {selectedSubcategory.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">{selectedSubcategory.description}</p>
              )}
            </div>

            <button
              onClick={() => navigate(`/products?cat=${selectedCategory.id}`)}
              className="flex items-center gap-1.5 text-primary text-xs font-heading font-bold mb-6 hover:underline"
            >
              <ArrowLeft size={13} /> Back to Subcategories
            </button>

            {itemsLoading ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm font-semibold">
                No products in this subcategory yet. Please check back soon.
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {items.map((item, i) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
