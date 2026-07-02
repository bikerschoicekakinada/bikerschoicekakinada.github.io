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
 * Computes the Levenshtein edit distance between two strings.
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
 * Checks if a query word matches a product word (with typo tolerance and abbreviations).
 */
function isWordMatch(qWord: string, pWord: string): { matches: boolean; score: number } {
  const qw = qWord.toLowerCase();
  const pw = pWord.toLowerCase();

  // Exact Match
  if (qw === pw) {
    return { matches: true, score: 100 };
  }

  // Prefix Match (e.g., "helm" -> "helmet")
  if (pw.startsWith(qw) && qw.length >= 3) {
    return { matches: true, score: 70 };
  }

  // Size Abbreviations Match (e.g. standalone "l" -> "large", "m" -> "medium", "s" -> "small")
  if (qw === "l" && pw === "large") return { matches: true, score: 80 };
  if (qw === "m" && pw === "medium") return { matches: true, score: 80 };
  if (qw === "s" && pw === "small") return { matches: true, score: 80 };

  // Fuzzy Match (Typo Tolerance)
  // Only allow typo tolerance for query words of length 3 or more
  if (qw.length >= 3) {
    const maxDistance = qw.length <= 4 ? 1 : 2;
    const distance = getLevenshteinDistance(qw, pw);
    if (distance <= maxDistance) {
      // Closer distance gets higher score
      return { matches: true, score: 50 - distance * 15 };
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
  categoryIdScope: string | null = null
): SearchResult[] {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!trimmed) return [];

  const queryWords = trimmed.split(" ");
  const results: SearchResult[] = [];

  for (const item of items) {
    // If scoped to a specific category, filter out other items first
    if (categoryIdScope && item.category_id !== categoryIdScope) {
      continue;
    }

    const category = categories.find((c) => c.id === item.category_id);
    const categoryName = category ? category.name.toLowerCase() : "";
    const itemLabel = item.label.toLowerCase();
    const itemWords = itemLabel.split(/[ \-_/]/).filter(Boolean);

    let matchCount = 0;
    let totalScore = 0;

    // Check if the entire query matches the label exactly
    if (itemLabel.includes(trimmed)) {
      totalScore += 200;
      if (itemLabel === trimmed) {
        totalScore += 1000;
      }
    }

    // Check query words
    for (const qWord of queryWords) {
      let wordMatched = false;
      let highestWordScore = 0;

      // Check category match
      if (categoryName.includes(qWord)) {
        wordMatched = true;
        highestWordScore = Math.max(highestWordScore, 40);
      }

      // Check match against each word in the product label
      for (const pWord of itemWords) {
        const { matches, score } = isWordMatch(qWord, pWord);
        if (matches) {
          wordMatched = true;
          highestWordScore = Math.max(highestWordScore, score);
        }
      }

      if (wordMatched) {
        matchCount++;
        totalScore += highestWordScore;
      }
    }

    // All query words must match somewhere (Fuzzy or exact)
    if (matchCount === queryWords.length) {
      // Prioritize exact match and position
      results.push({ item, score: totalScore });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Generates auto-complete search suggestions (like Amazon).
 */
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

  // 2. Suggest matching product labels (limit to top matches)
  const queryWords = trimmed.split(" ");
  items.forEach((item) => {
    const label = item.label;
    const labelLower = label.toLowerCase();
    
    // If it matches all query words as substrings
    const matchesAll = queryWords.every(word => labelLower.includes(word));
    if (matchesAll) {
      // Clean suggestions (e.g. showing full product title or short common parts)
      suggestionsMap.set(`item:${label}`, {
        text: label,
        type: "product",
      });
    }
  });

  // Return maximum 8 suggestions
  return Array.from(suggestionsMap.values()).slice(0, 8);
}
