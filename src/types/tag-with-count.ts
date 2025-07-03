import type { Tag } from "./tag";

export interface TagWithCount extends Tag {
  _count: { bookmarks: number };
}
