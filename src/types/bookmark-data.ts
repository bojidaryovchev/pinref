export interface BookmarkData {
  id: string;
  userId: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
  categoryId?: string;
  tagIds?: string[];
  isFavorite?: boolean;
  searchTokens?: string[];
}
