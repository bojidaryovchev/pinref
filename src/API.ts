/**
 * Centralized API functions for client-side data fetching
 */

import { 
  BookmarkQueryOptions, 
  Bookmark, 
  CreateBookmarkInput 
} from "./schemas/bookmark.schema";
import { 
  Category, 
  CreateCategoryInput 
} from "./schemas/category.schema";
import { 
  Tag, 
  CreateTagInput 
} from "./schemas/tag.schema";
import { 
  API_ENDPOINTS
} from "./constants";

// CLIENT-SIDE API FUNCTIONS

/**
 * Bookmark API Functions
 */

// Get bookmarks with optional filtering
export const getBookmarks = async (options: BookmarkQueryOptions): Promise<{ 
  bookmarks: Bookmark[], 
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    totalPages: number; 
  } 
}> => {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.categoryId) params.append('category', options.categoryId);
  if (options.tagId) params.append('tag', options.tagId);
  if (options.isFavorite) params.append('favorite', 'true');
  if (options.query) params.append('q', options.query);
  
  const url = `${API_ENDPOINTS.BOOKMARKS}?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch bookmarks');
  }
  
  return response.json();
};

// Get a single bookmark by ID
export const getBookmark = async (id: string): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id));
  
  if (!response.ok) {
    throw new Error('Failed to fetch bookmark');
  }
  
  return response.json();
};

// Create a new bookmark
export const createBookmark = async (data: CreateBookmarkInput): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARKS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create bookmark');
  }
  
  return response.json();
};

// Update an existing bookmark
export const updateBookmark = async (id: string, data: Partial<CreateBookmarkInput>): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update bookmark');
  }
  
  return response.json();
};

// Delete a bookmark
export const deleteBookmark = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete bookmark');
  }
};

// Toggle bookmark favorite status
export const toggleBookmarkFavorite = async (id: string, isFavorite: boolean): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isFavorite }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update favorite status');
  }
  
  return response.json();
};

/**
 * Category API Functions
 */

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(API_ENDPOINTS.CATEGORIES);
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return response.json();
};

// Get a single category
export const getCategory = async (id: string): Promise<Category> => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id));
  
  if (!response.ok) {
    throw new Error('Failed to fetch category');
  }
  
  return response.json();
};

// Create a new category
export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const response = await fetch(API_ENDPOINTS.CATEGORIES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create category');
  }
  
  return response.json();
};

// Update an existing category
export const updateCategory = async (id: string, data: Partial<CreateCategoryInput>): Promise<Category> => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update category');
  }
  
  return response.json();
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
};

/**
 * Tag API Functions
 */

// Get all tags
export const getTags = async (): Promise<Tag[]> => {
  const response = await fetch(API_ENDPOINTS.TAGS);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  
  return response.json();
};

// Get a single tag
export const getTag = async (id: string): Promise<Tag> => {
  const response = await fetch(API_ENDPOINTS.TAG_BY_ID(id));
  
  if (!response.ok) {
    throw new Error('Failed to fetch tag');
  }
  
  return response.json();
};

// Create a new tag
export const createTag = async (data: CreateTagInput): Promise<Tag> => {
  const response = await fetch(API_ENDPOINTS.TAGS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create tag');
  }
  
  return response.json();
};

// Update an existing tag
export const updateTag = async (id: string, data: Partial<CreateTagInput>): Promise<Tag> => {
  const response = await fetch(API_ENDPOINTS.TAG_BY_ID(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update tag');
  }
  
  return response.json();
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.TAG_BY_ID(id), {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete tag');
  }
};
