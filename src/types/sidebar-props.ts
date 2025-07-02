import type { CategoryWithCount } from './category-with-count';
import type { TagWithCount } from './tag-with-count';

export interface SidebarProps {
  categories: CategoryWithCount[];
  tags: TagWithCount[];
  selectedCategory?: string;
  selectedTag?: string;
  showFavorites: boolean;
  onCategorySelect: (categoryId?: string) => void;
  onTagSelect: (tagId?: string) => void;
  onFavoritesToggle: () => void;
  onShowAll: () => void;
}
