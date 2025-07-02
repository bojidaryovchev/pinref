/**
 * Application constants and configuration values
 */

/** Email address where contact form submissions will be sent */
export const CONTACT_EMAIL = "contact@yourcompany.com";

/** Site metadata */
export const SITE_TITLE = "Pinref - Visual Bookmark Manager";
export const SITE_DESCRIPTION = "A modern visual bookmark manager with categories, tags, and smart search";

/** Toaster config */
export const TOASTER_DURATION_MS = 6000;

/** DynamoDB table configuration */
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "bookmark-manager";

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
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";

/** Search configuration */
export const SEARCH_RESULTS_LIMIT = 50;
export const SEARCH_DEBOUNCE_MS = 300;

/** Mock data for demo purposes */
export const MOCK_CATEGORIES = [
  { id: "1", name: "Development", icon: "💻", color: "#3b82f6", _count: { bookmarks: 5 } },
  { id: "2", name: "Design", icon: "🎨", color: "#8b5cf6", _count: { bookmarks: 3 } },
  { id: "3", name: "News", icon: "📰", color: "#ef4444", _count: { bookmarks: 2 } },
  { id: "4", name: "Learning", icon: "📚", color: "#10b981", _count: { bookmarks: 4 } },
];

export const MOCK_TAGS = [
  { id: "1", name: "React", _count: { bookmarks: 3 } },
  { id: "2", name: "JavaScript", _count: { bookmarks: 4 } },
  { id: "3", name: "CSS", _count: { bookmarks: 2 } },
  { id: "4", name: "Tutorial", _count: { bookmarks: 3 } },
  { id: "5", name: "Tools", _count: { bookmarks: 2 } },
];

export const MOCK_BOOKMARKS = [
  {
    id: "1",
    url: "https://react.dev",
    title: "React - The library for web and native user interfaces",
    description: "React lets you build user interfaces out of individual pieces called components.",
    image: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
    favicon: "https://react.dev/favicon.ico",
    domain: "react.dev",
    isFavorite: true,
  },
  {
    id: "2",
    url: "https://tailwindcss.com",
    title: "Tailwind CSS - Rapidly build modern websites",
    description: "A utility-first CSS framework packed with classes that can be composed to build any design.",
    image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    favicon: "https://tailwindcss.com/favicon.ico",
    domain: "tailwindcss.com",
    isFavorite: false,
  },
  {
    id: "3",
    url: "https://nextjs.org",
    title: "Next.js by Vercel - The React Framework",
    description: "Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
    image: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
    favicon: "https://nextjs.org/favicon.ico",
    domain: "nextjs.org",
    isFavorite: true,
  },
  {
    id: "4",
    url: "https://www.figma.com",
    title: "Figma: The collaborative interface design tool",
    description: "Build better products as a team. Design, prototype, and gather feedback all in one place.",
    image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    favicon: "https://www.figma.com/favicon.ico",
    domain: "figma.com",
    isFavorite: false,
  },
  {
    id: "5",
    url: "https://developer.mozilla.org",
    title: "MDN Web Docs",
    description: "The MDN Web Docs site provides information about Open Web technologies.",
    image: "https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=800",
    favicon: "https://developer.mozilla.org/favicon.ico",
    domain: "developer.mozilla.org",
    isFavorite: true,
  },
  {
    id: "6",
    url: "https://github.com",
    title: "GitHub: Let's build from here",
    description: "GitHub is where over 100 million developers shape the future of software, together.",
    image: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
    favicon: "https://github.com/favicon.ico",
    domain: "github.com",
    isFavorite: false,
  },
];

/** User session mock data */
export const MOCK_USER_SESSION = {
  user: { 
    id: "temp-user", 
    name: "Demo User", 
    email: "demo@example.com" 
  }
};

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
