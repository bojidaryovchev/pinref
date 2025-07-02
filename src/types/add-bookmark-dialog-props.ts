import type { Category } from './category';
import type { Tag } from './tag';

export interface AddBookmarkDialogProps {
  categories: Category[];
  tags: Tag[];
  onBookmarkAdded: () => void;
}
