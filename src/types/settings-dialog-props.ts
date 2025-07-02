import type { CategoryWithCount } from './category-with-count';
import type { TagWithCount } from './tag-with-count';

export interface SettingsDialogProps {
  categories: CategoryWithCount[];
  tags: TagWithCount[];
  onCategoriesUpdate: () => void;
  onTagsUpdate: () => void;
}
