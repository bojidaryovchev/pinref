import { Category } from "./category.interface";
import { Tag } from "./tag.interface";

export interface Bookmark {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
  isFavorite: boolean;
  category?: Category;
  tags: Tag[];
  createdAt: string;
}
