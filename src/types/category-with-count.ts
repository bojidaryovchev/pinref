import type { Category } from "./category";

export interface CategoryWithCount extends Category {
  _count: { bookmarks: number };
}
