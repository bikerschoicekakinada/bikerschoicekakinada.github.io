import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDeliveryCategories, type DeliveryCategory } from "@/hooks/useDeliveryCategories";
import { useDeliveryItems } from "@/hooks/useDeliveryItems";
import { useSmartProductSearch } from "@/hooks/useSmartProductSearch";
import CategoryGrid from "./CategoryGrid";
import CategoryItems from "./CategoryItems";
import ProductSearchBar from "./ProductSearchBar";
import { Search } from "lucide-react";
import type { SearchSuggestion } from "@/lib/searchEngine";

const OnlineDelivery = () => {
  const { categories, loading: catsLoading, usingFallback } = useDeliveryCategories();
  const [selectedCategory, setSelectedCategory] = useState<DeliveryCategory | null>(null);
  
  // Search text states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debouncing logic (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Standard category items query
  const { items, loading: itemsLoading } = useDeliveryItems(
    selectedCategory?.id ?? null,
    usingFallback
  );

  // Smart Search Hook
  const { searchResults, suggestions, search, loading: searchLoading } = useSmartProductSearch(
    categories,
    usingFallback
  );

  // Trigger search on debounced query updates or category changes
  useEffect(() => {
    search(debouncedSearch, selectedCategory?.id ?? null);
  }, [debouncedSearch, selectedCategory, search]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "category" && suggestion.categoryName) {
      const foundCat = categories.find(
        (c) => c.name.toLowerCase() === suggestion.categoryName?.toLowerCase()
      );
      if (foundCat) {
        setSelectedCategory(foundCat);
        setSearchTerm("");
        setDebouncedSearch("");
      }
    } else {
      setSearchTerm(suggestion.text);
      setDebouncedSearch(suggestion.text);
    }
  };

  const isSearching = debouncedSearch.trim().length > 0;
  const showLoading = itemsLoading || (isSearching && searchLoading);

  return (
    <section id="delivery" className="py-12 px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">
          Online Delivery
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {selectedCategory
            ? "Tap an item to order via WhatsApp"
            : "Browse categories and order via WhatsApp"}
        </p>
      </motion.div>

      {/* Sticky Search Bar */}
      {!catsLoading && (
        <ProductSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          loading={isSearching && searchLoading}
          onClear={handleClearSearch}
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

      <div className="pt-6">
        {catsLoading && (
          <p className="text-muted-foreground text-sm text-center py-8">Loading categories...</p>
        )}

        {/* 1. Search Results Active */}
        {!catsLoading && isSearching && (
          <>
            {showLoading ? (
              <p className="text-muted-foreground text-sm text-center py-8">Searching products...</p>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground border border-border/40">
                  <Search size={28} className="opacity-60 text-secondary" />
                </div>
                <h3 className="text-base font-heading font-bold text-foreground mb-1">
                  No matching products found.
                </h3>
                <p className="text-xs text-muted-foreground">
                  Try another keyword, brand, or search for different accessories.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="mt-4 text-xs font-semibold text-primary hover:underline"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <CategoryItems
                items={searchResults}
                categoryName={selectedCategory ? `${selectedCategory.name} - Search Results` : "Search Results"}
                loading={false}
                highlightText={debouncedSearch}
                onBack={() => {
                  handleClearSearch();
                  setSelectedCategory(null);
                }}
              />
            )}
          </>
        )}

        {/* 2. Standard View (No Search Active) */}
        {!catsLoading && !isSearching && (
          <>
            {/* Show Category selection grid if no category selected */}
            {!selectedCategory && (
              <CategoryGrid
                categories={categories}
                onSelectCategory={(cat) => {
                  handleClearSearch();
                  setSelectedCategory(cat);
                }}
              />
            )}

            {/* Show category items if category is selected */}
            {selectedCategory && (
              <CategoryItems
                items={items}
                categoryName={selectedCategory.name}
                loading={showLoading}
                onBack={() => setSelectedCategory(null)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default OnlineDelivery;
