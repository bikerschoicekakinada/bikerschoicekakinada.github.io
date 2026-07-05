import type { DeliveryItem } from "@/hooks/useDeliveryItems";
import type { DeliveryCategory } from "@/hooks/useDeliveryCategories";

export interface SearchResult {
  item: DeliveryItem;
  score: number;
}

export interface SearchSuggestion {
  text: string;
  type: "product" | "category" | "brand" | "phrase";
  categoryName?: string;
}

/**
 * Computes the Levenshtein edit distance between two strings for typo tolerance.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Checks if a query word matches a product word (with typo tolerance).
 */
function isWordMatch(qWord: string, pWord: string): { matches: boolean; score: number } {
  const qw = qWord.toLowerCase();
  const pw = pWord.toLowerCase();

  // Exact Match
  if (qw === pw) {
    return { matches: true, score: 200 };
  }

  // Prefix Match (e.g., "helm" -> "helmet")
  if (pw.startsWith(qw) && qw.length >= 3) {
    return { matches: true, score: 120 };
  }

  // Fuzzy Match (Typo Tolerance)
  if (qw.length >= 3) {
    const maxDistance = qw.length <= 4 ? 1 : 2;
    const distance = getLevenshteinDistance(qw, pw);
    if (distance <= maxDistance) {
      return { matches: true, score: 80 - distance * 25 };
    }
  }

  return { matches: false, score: 0 };
}

/**
 * Parses and ranks products based on a search query.
 * Multi-word search, independent of word order, with relevance ranking.
 */
export function performSmartSearch(
  items: DeliveryItem[],
  categories: DeliveryCategory[],
  query: string,
  categoryIdScope: string | null = null,
  subcategories: { id: string; name: string }[] = []
): SearchResult[] {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!trimmed) return [];

  const queryWords = trimmed.split(" ");
  const results: SearchResult[] = [];

  for (const item of items) {
    // Category scope check
    if (categoryIdScope && item.category_id !== categoryIdScope) {
      continue;
    }

    const category = categories.find((c) => c.id === item.category_id);
    const categoryName = category ? category.name.toLowerCase() : "";

    const subcategory = subcategories.find((s) => s.id === item.subcategory_id);
    const subcategoryName = subcategory ? subcategory.name.toLowerCase() : "";

    const itemLabel = item.label.toLowerCase();
    const itemWords = itemLabel.split(/[ \-_/]/).filter(Boolean);
    const compatibleBikes = (item.compatible_bikes || []).map(b => b.toLowerCase());
    const brand = (item.brand || "").toLowerCase();

    let matchCount = 0;
    let totalScore = 0;

    // 1. Check Product Name Exact Matches (Highest Priority)
    if (itemLabel.includes(trimmed)) {
      totalScore += 500;
      if (itemLabel === trimmed) {
        totalScore += 1000;
      }
    }

    // Check individual query words
    for (const qWord of queryWords) {
      let wordMatched = false;
      let highestWordScore = 0;

      // 2. Check Bike Compatibility Tags (Priority 2)
      for (const bike of compatibleBikes) {
        if (bike === qWord) {
          wordMatched = true;
          highestWordScore = Math.max(highestWordScore, 400);
        } else if (bike.includes(qWord)) {
          wordMatched = true;
          highestWordScore = Math.max(highestWordScore, 200);
        }
      }

      // 3. Check Product Name Words (Priority 1 Partials)
      for (const pWord of itemWords) {
        const { matches, score } = isWordMatch(qWord, pWord);
        if (matches) {
          wordMatched = true;
          highestWordScore = Math.max(highestWordScore, score);
        }
      }

      // 4. Check Subcategory Match (Priority 3)
      if (subcategoryName.includes(qWord)) {
        wordMatched = true;
        highestWordScore = Math.max(highestWordScore, 100);
      }

      // 5. Check Category Match (Priority 4)
      if (categoryName.includes(qWord)) {
        wordMatched = true;
        highestWordScore = Math.max(highestWordScore, 80);
      }

      // 6. Check Brand Match (Fallback compatibility)
      if (brand && (brand === qWord || brand.includes(qWord))) {
        wordMatched = true;
        highestWordScore = Math.max(highestWordScore, 50);
      }

      if (wordMatched) {
        matchCount++;
        totalScore += highestWordScore;
      }
    }

    // All query words must match somewhere
    if (matchCount === queryWords.length) {
      results.push({ item, score: totalScore });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function generateSuggestions(
  items: DeliveryItem[],
  categories: DeliveryCategory[],
  query: string
): SearchSuggestion[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  const suggestionsMap = new Map<string, SearchSuggestion>();

  // 1. Suggest matching categories
  categories.forEach((cat) => {
    if (cat.name.toLowerCase().includes(trimmed)) {
      suggestionsMap.set(`cat:${cat.name}`, {
        text: cat.name,
        type: "category",
        categoryName: cat.name,
      });
    }
  });

  // 2. Suggest matching product labels
  const queryWords = trimmed.split(" ");
  items.forEach((item) => {
    const label = item.label;
    const labelLower = label.toLowerCase();
    
    const matchesAll = queryWords.every(word => labelLower.includes(word));
    if (matchesAll) {
      suggestionsMap.set(`item:${label}`, {
        text: label,
        type: "product",
      });
    }
  });

  return Array.from(suggestionsMap.values()).slice(0, 5);
}
