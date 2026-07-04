import React, { useState, useRef, useEffect } from "react";
import { Search, X, CornerDownLeft, Tag } from "lucide-react";
import type { SearchSuggestion } from "@/lib/searchEngine";

interface ProductSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  loading: boolean;
  onClear: () => void;
  suggestions: SearchSuggestion[];
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  value,
  onChange,
  loading,
  onClear,
  suggestions,
  onSuggestionClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="sticky top-16 z-30 w-full bg-background/90 backdrop-blur-md py-3 border-b border-border/20 shadow-sm transition-all duration-300"
    >
      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <span className="absolute left-3.5 text-muted-foreground flex items-center justify-center pointer-events-none">
            <Search size={18} />
          </span>

          {/* Input field */}
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search helmets, tyres, riding gear, custom wraps..."
            className="w-full bg-muted/60 border border-border/80 hover:border-primary/50 focus:border-primary rounded-full pl-11 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-heading font-medium tracking-wide"
            aria-label="Search helmets, tyres, riding gear, custom wraps"
          />

          {/* Loading / Clear Controls */}
          <div className="absolute right-3.5 flex items-center gap-1.5">
            {loading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}

            {value && (
              <button
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-full transition-colors flex items-center justify-center min-w-[28px] min-h-[28px]"
                aria-label="Clear search input"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown (Amazon-style) */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-card/95 border border-border/70 rounded-2xl shadow-xl backdrop-blur-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <div className="py-1">
              <p className="text-[10px] text-muted-foreground px-4 py-1.5 font-heading font-semibold uppercase tracking-wider border-b border-border/30">
                Suggestions
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.text}-${index}`}
                  onMouseDown={(e) => {
                    // Prevent input blur before click handler fires
                    e.preventDefault();
                    onSuggestionClick(suggestion);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/80 transition-colors border-b border-border/10 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {suggestion.type === "category" ? (
                      <Tag size={15} className="text-primary flex-shrink-0" />
                    ) : (
                      <Search size={15} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm font-heading font-medium truncate text-foreground">
                      {suggestion.text}
                      {suggestion.type === "category" && (
                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                          in Categories
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <span className="text-muted-foreground/40 hover:text-foreground transition-colors pr-1 hidden sm:inline-block">
                    <CornerDownLeft size={14} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearchBar;
