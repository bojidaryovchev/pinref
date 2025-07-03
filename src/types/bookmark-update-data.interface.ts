export interface BookmarkUpdateData {
  title?: string;
  description?: string;
  categoryId?: string;
  tagIds?: string[];
  isFavorite?: boolean;
  searchTokens?: string[]; // Added for search index updates
}
