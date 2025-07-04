/**
 * Server actions index - exports all actions for convenient importing
 */

// Bookmark actions
export {
  createBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
} from "./bookmarks";

// Category actions
export {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "./categories";

// Tag actions
export {
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "./tags";

// User settings actions
export {
  updateUserSettingsAction,
} from "./user-settings";

// Search actions
export {
  rebuildSearchIndexAction,
} from "./search";
