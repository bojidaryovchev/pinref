export interface Bookmark {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
  isFavorite: boolean;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  tags: {
    id: string;
    name: string;
  }[];
  createdAt: string;
}
