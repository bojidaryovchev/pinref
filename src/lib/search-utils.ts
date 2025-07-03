/**
 * Utility functions for search scoring and token manipulation using the inverted index approach
 * This emulates Elasticsearch-like scoring for relevance ranking
 */

import type { BookmarkWithScore } from "@/types/bookmark-with-score.interface";

/**
 * Calculate the search score based on token overlap between query and bookmark tokens
 * Higher score = better match
 *
 * Scoring rules:
 * - Exact match: 10 points
 * - Prefix match: 5 points (token starts with query or vice versa)
 * - Partial match: 1 point (token contains query or vice versa)
 *
 * @param queryTokens - The tokens from the search query
 * @param bookmarkTokens - The tokens stored in the bookmark
 * @returns The calculated score
 */
export function calculateSearchScore(queryTokens: string[], bookmarkTokens: string[]): number {
  let score = 0;

  // Early return for empty arrays
  if (!queryTokens.length || !bookmarkTokens.length) {
    return score;
  }

  for (const queryToken of queryTokens) {
    for (const bookmarkToken of bookmarkTokens) {
      if (bookmarkToken.includes(queryToken) || queryToken.includes(bookmarkToken)) {
        // Exact matches get highest score
        if (bookmarkToken === queryToken) {
          score += 10;
        }
        // Prefix matches get medium score
        else if (bookmarkToken.startsWith(queryToken) || queryToken.startsWith(bookmarkToken)) {
          score += 5;
        }
        // Partial matches get lowest score
        else {
          score += 1;
        }
      }
    }
  }

  return score;
}

/**
 * Sort an array of bookmark results by search score, highest first
 *
 * @param results - The array of scored bookmarks to sort
 * @returns A new sorted array
 */
export function sortBySearchScore(results: BookmarkWithScore[]): BookmarkWithScore[] {
  return [...results].sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
}

/**
 * Apply search scoring to bookmark results using an Elasticsearch-inspired approach
 *
 * This implements TF-IDF-like scoring with field boosting:
 * - Title matches are weighted highest
 * - Domain matches are weighted next highest
 * - Description and URL matches have standard weight
 * - Exact matches score higher than partial matches
 * - Multiple matching tokens increase the score
 *
 * @param bookmarks - The bookmark items to score
 * @param queryTokens - The search query tokens
 * @returns The bookmarks with scores assigned
 */
export function applySearchScoring(bookmarks: unknown[], queryTokens: string[]): BookmarkWithScore[] {
  // Normalize and prepare query tokens
  const normalizedQueryTokens = queryTokens.map((token) => token.toLowerCase());

  return bookmarks.map((item) => {
    const bookmark = item as BookmarkWithScore;

    // Extract searchable content from the bookmark
    const title = ((bookmark.title as string) || "").toLowerCase();
    const description = ((bookmark.description as string) || "").toLowerCase();
    const url = ((bookmark.url as string) || "").toLowerCase();
    const domain = ((bookmark.domain as string) || "").toLowerCase();

    // Generate tokens from the bookmark content
    const titleTokens = title.split(/\s+/).filter((t) => t.length > 0);
    const descriptionTokens = description.split(/\s+/).filter((t) => t.length > 0);
    const urlTokens = url
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 0);
    const domainTokens = domain.split(/[.-]/).filter((t) => t.length > 0);

    // All bookmark tokens for general matching
    const bookmarkTokens = [...titleTokens, ...descriptionTokens, ...urlTokens, ...domainTokens];

    // Calculate score based on the presence and field of query tokens
    let score = 0;

    // Field boosting weights
    const WEIGHTS = {
      TITLE_EXACT: 30, // Exact match in title
      TITLE_CONTAINS: 20, // Partial match in title
      DOMAIN_EXACT: 25, // Exact match in domain
      DOMAIN_CONTAINS: 15, // Partial match in domain
      DESC_EXACT: 10, // Exact match in description
      DESC_CONTAINS: 5, // Partial match in description
      URL_EXACT: 8, // Exact match in URL
      URL_CONTAINS: 4, // Partial match in URL
    };

    // Score title matches (highest priority)
    for (const token of normalizedQueryTokens) {
      // Exact title match or token
      if (titleTokens.includes(token)) {
        score += WEIGHTS.TITLE_EXACT;
      }
      // Title contains the token
      else if (title.includes(token)) {
        score += WEIGHTS.TITLE_CONTAINS;
      }

      // Domain matches (high priority for discovery)
      if (domainTokens.includes(token)) {
        score += WEIGHTS.DOMAIN_EXACT;
      } else if (domain.includes(token)) {
        score += WEIGHTS.DOMAIN_CONTAINS;
      }

      // Description matches
      if (descriptionTokens.includes(token)) {
        score += WEIGHTS.DESC_EXACT;
      } else if (description.includes(token)) {
        score += WEIGHTS.DESC_CONTAINS;
      }

      // URL matches
      if (urlTokens.includes(token)) {
        score += WEIGHTS.URL_EXACT;
      } else if (url.includes(token)) {
        score += WEIGHTS.URL_CONTAINS;
      }
    }

    // Additional scoring from token overlap for edge cases
    score += calculateSearchScore(normalizedQueryTokens, bookmarkTokens);

    // Calculate freshness boost (newer bookmarks rank slightly higher)
    let freshnessBoost = 0;
    if (typeof bookmark.createdAt === "string") {
      const createdAt = new Date(bookmark.createdAt).getTime();
      const now = Date.now();
      const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      freshnessBoost = Math.max(0, 5 - Math.min(5, ageInDays / 30)); // Up to 5 points for newest items
    }

    return {
      ...bookmark,
      searchScore: score + freshnessBoost,
    };
  });
}
