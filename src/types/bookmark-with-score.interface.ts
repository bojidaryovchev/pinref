export interface BookmarkWithScore extends Record<string, unknown> {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  domain?: string;
  createdAt?: string;
  searchTokens?: string[];
  searchScore: number;
}
