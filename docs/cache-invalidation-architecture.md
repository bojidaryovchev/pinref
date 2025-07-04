# Tag-Based Cache Invalidation Architecture in Pinref

This document outlines how the new tag-based cache invalidation system works in Pinref.

## Architecture Overview

The new architecture follows these principles:

1. **Server Actions in API.ts**: All API functions are defined in `API.ts`
2. **Tag-Based Cache Invalidation**: Each fetch function is associated with a tag
3. **API Routes**: API routes use functions from `API.ts`
4. **SWR Integration**: SWR hooks call the API routes for data fetching
5. **Automatic Invalidation**: When data changes, relevant caches are invalidated

## Cache Tags

We use the following cache tags:

```typescript
export const CACHE_TAGS = {
  BOOKMARKS: "bookmarks",
  CATEGORIES: "categories",
  TAGS: "tags",
  USER_SETTINGS: "user-settings",
  SEARCH_INDEX: "search-index",
};
```

## How It Works

1. **Data Fetching with Cache Tags**

```typescript
// Example GET function with cache tag
export const getBookmarks = async () => {
  const response = await fetch(API_ENDPOINTS.BOOKMARKS, {
    next: { tags: [CACHE_TAGS.BOOKMARKS] }, // Add tag for cache invalidation
  });
  return response.json();
};
```

2. **Cache Invalidation on Updates**

```typescript
// Example create function with cache invalidation
export const createBookmark = async (data) => {
  const response = await fetch(API_ENDPOINTS.BOOKMARKS, {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Invalidate bookmarks cache after creating a bookmark
  invalidateBookmarksCache();

  return response.json();
};
```

3. **Cross-Entity Cache Invalidation**

When one entity affects another (e.g., updating a category affects bookmarks), we invalidate both caches:

```typescript
// Example update function with multiple cache invalidations
export const updateCategory = async (id, data) => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  // Invalidate categories cache
  invalidateCategoriesCache();
  // Also invalidate bookmarks cache as they might display category info
  invalidateBookmarksCache();

  return response.json();
};
```

## Benefits

1. **Improved Data Freshness**: Changes are reflected immediately in the UI
2. **Reduced Manual Refetching**: No need to manually call mutate on SWR hooks
3. **Automatic Dependency Management**: Related data is invalidated together
4. **Efficient Caching**: Unchanged data remains cached for performance

## How to Use in Components

When using SWR hooks, you no longer need to manually invalidate the cache:

```typescript
// Before (manual invalidation)
const { data, mutate } = useBookmarks();
const handleAddBookmark = async (data) => {
  await createBookmark(data);
  mutate(); // Manual invalidation
};

// After (automatic invalidation)
const { data } = useBookmarks();
const handleAddBookmark = async (data) => {
  await createBookmark(data);
  // No need to call mutate() - the cache is automatically invalidated
};
```

## Image Loading Fix

To address the image loading issues with external URLs, we've updated the Next.js config to explicitly allow common domains:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
    domains: [
      // Common favicon domains
      "www.google.com",
      "www.youtube.com",
      // ...and more
    ],
  },
};
```

## Testing the Changes

After deploying these changes, verify that:

1. Data is properly fetched and cached
2. Updates to data are immediately reflected in the UI
3. Related data is updated when dependencies change
4. External images load correctly in bookmark cards
