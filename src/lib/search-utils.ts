/**
 * Utility functions for search scoring and token manipulation
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
 * Apply search scoring to bookmark results
 * 
 * @param bookmarks - The bookmark items to score
 * @param queryTokens - The search query tokens
 * @returns The bookmarks with scores assigned
 */
export function applySearchScoring(
  bookmarks: unknown[], 
  queryTokens: string[]
): BookmarkWithScore[] {
  return bookmarks.map((item) => {
    const bookmark = item as BookmarkWithScore;
    // Parse the JSON string back to an array of tokens
    const bookmarkTokens = typeof bookmark.searchTokens === 'string' 
      ? JSON.parse(bookmark.searchTokens || '[]')
      : bookmark.searchTokens || [];
    
    return {
      ...bookmark,
      searchScore: calculateSearchScore(queryTokens, bookmarkTokens),
    };
  });
}
