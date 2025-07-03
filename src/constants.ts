/**
 * Application constants and configuration values
 */

/** Email address where contact form submissions will be sent */
export const CONTACT_EMAIL = "support@pinref.com";

/** Site metadata */
export const SITE_TITLE = "Pinref - Visual Bookmark Manager";
export const SITE_DESCRIPTION = "A modern visual bookmark manager with categories, tags, and smart search";

/** Toaster config */
export const TOASTER_DURATION_MS = 6000;

/** DynamoDB table configuration */
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;

/** Entity types for DynamoDB single-table design */
export const ENTITY_TYPES = {
  USER: "USER",
  BOOKMARK: "BOOKMARK",
  CATEGORY: "CATEGORY",
  TAG: "TAG",
} as const;

/** Default colors for categories */
export const PRESET_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
];

/** Default icons for categories */
export const PRESET_ICONS = [
  "💻",
  "🎨",
  "📚",
  "🎵",
  "🎮",
  "🏠",
  "💼",
  "🍔",
  "✈️",
  "🏃",
  "📱",
  "🎯",
  "🔧",
  "📊",
  "🌟",
  "🔥",
];

/** Default tag icons */
export const PRESET_TAG_ICONS = [
  "🏷️",
  "⭐",
  "🔥",
  "💡",
  "🎯",
  "📌",
  "🚀",
  "💎",
  "🎨",
  "🔧",
  "📚",
  "💻",
  "🎵",
  "🎮",
  "🏠",
  "💼",
  "🍔",
  "✈️",
  "🏃",
  "📱",
];

/** AWS configuration */
export const AWS_REGION = process.env.AWS_REGION!;

/** API endpoint URLs */
export const API_ENDPOINTS = {
  BOOKMARKS: "/api/bookmarks",
  BOOKMARK_BY_ID: (id: string) => `/api/bookmarks/${id}`,
  CATEGORIES: "/api/categories",
  CATEGORY_BY_ID: (id: string) => `/api/categories/${id}`,
  TAGS: "/api/tags",
  TAG_BY_ID: (id: string) => `/api/tags/${id}`,
  CONTACT: "/api/contact",
};

/** SWR Configuration */
export const SWR_CONFIG = {
  REFRESH_INTERVAL: 60000, // 1 minute
  BOOKMARK_CACHE_KEY: "bookmarks",
  CATEGORY_CACHE_KEY: "categories",
  TAG_CACHE_KEY: "tags",
};

/** Search configuration */
export const SEARCH_RESULTS_LIMIT = 100;
export const MIN_SEARCH_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;

/** Authentication status constants */
export const AUTH_STATUS = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
} as const;

/** UI text constants */
export const PLACEHOLDERS = {
  SEARCH_BOOKMARKS: "Search bookmarks...",
  URL_INPUT: "https://example.com",
  SELECT_CATEGORY: "Select a category",
  CATEGORY_NAME: "Enter category name",
  CATEGORY_ICON: "Enter emoji or icon",
  COLOR_INPUT: "#3b82f6",
  TAG_NAME: "Enter tag name",
  TAG_ICON: "Enter emoji or leave empty",
} as const;

/** Button text constants */
export const BUTTON_TEXT = {
  ADD_BOOKMARK: "Add Bookmark",
  CANCEL: "Cancel",
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  SAVE: "Save",
  SETTINGS: "Settings",
  SIGN_OUT: "Sign Out",
  ALL_BOOKMARKS: "All Bookmarks",
  FAVORITES: "Favorites",
  EXPORT_BOOKMARKS: "Export Bookmarks",
  IMPORT_BOOKMARKS: "Import Bookmarks",
  REBUILD_SEARCH_INDEX: "Rebuild Search Index",
  DELETE_ALL_DATA: "Delete All Data",
} as const;

/** Toast messages */
export const TOAST_MESSAGES = {
  BOOKMARK_ADDED: "Bookmark added successfully",
  BOOKMARK_DELETED: "Bookmark deleted",
  BOOKMARK_UPDATED: "Bookmark updated",
  ADDED_TO_FAVORITES: "Added to favorites",
  REMOVED_FROM_FAVORITES: "Removed from favorites",
  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_DELETED: "Category deleted successfully",
  TAG_CREATED: "Tag created successfully",
  TAG_UPDATED: "Tag updated successfully",
  TAG_DELETED: "Tag deleted successfully",
  SETTING_UPDATED: "Setting updated",
  DATA_EXPORT_STARTED: "Data export started - this would download your encrypted bookmarks",
  IMPORT_FUNCTIONALITY: "Import functionality - this would allow uploading bookmark files",
  CACHE_CLEARED: "Cache cleared",
  AUTH_TEMPORARILY_DISABLED: "Bookmark functionality will be available once auth is re-enabled",
} as const;

/** Error messages */
export const ERROR_MESSAGES = {
  CATEGORY_NAME_REQUIRED: "Category name is required",
  TAG_NAME_REQUIRED: "Tag name is required",
  BOOKMARK_ADD_FAILED: "Failed to add bookmark",
} as const;
