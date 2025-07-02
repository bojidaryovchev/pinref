export interface BookmarkWithScore extends Record<string, unknown> {
  id: string;
  searchTokens?: string[];
  searchScore: number;
}
