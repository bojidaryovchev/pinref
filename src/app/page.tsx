"use client";

import AddBookmarkDialog from "@/components/add-bookmark-dialog";
import BookmarkCard from "@/components/bookmark-card";
import SearchBar from "@/components/search-bar";
import Sidebar from "@/components/sidebar";
import { AUTH_STATUS, MOCK_BOOKMARKS, MOCK_CATEGORIES, MOCK_TAGS, MOCK_USER_SESSION, TOAST_MESSAGES } from "@/constants";
import type { Bookmark } from "@/types/bookmark.interface";
import type { Category } from "@/types/category.interface";
import type { Tag } from "@/types/tag.interface";
import { BookOpen, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CategoryWithCount extends Category {
  _count: { bookmarks: number };
}

interface TagWithCount extends Tag {
  _count: { bookmarks: number };
}

const Home: React.FC = () => {
  // Temporarily disable auth - always show as authenticated
  const session = MOCK_USER_SESSION;
  const status = AUTH_STATUS.AUTHENTICATED;

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedTag, setSelectedTag] = useState<string>();
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (status === AUTH_STATUS.LOADING) return;
    if (!session) {
      setLoading(false);
      return;
    }

    // Load mock data instead of fetching from API
    loadMockData();
  }, [session, status]);

  useEffect(() => {
    if (session) {
      filterBookmarks();
    }
  }, [session, searchQuery, selectedCategory, selectedTag, showFavorites]);

  const loadMockData = () => {
    setCategories(MOCK_CATEGORIES);
    setTags(MOCK_TAGS);
    
    // Add missing category and tag references to bookmarks
    const bookmarksWithReferences = MOCK_BOOKMARKS.map((bookmark, index) => ({
      ...bookmark,
      category: MOCK_CATEGORIES[index % MOCK_CATEGORIES.length],
      tags: [MOCK_TAGS[index % MOCK_TAGS.length]],
      createdAt: new Date().toISOString(),
    }));
    
    setBookmarks(bookmarksWithReferences);
    setLoading(false);
  };

  const filterBookmarks = () => {
    // Simple client-side filtering for demo
    let filtered = [...bookmarks];

    if (searchQuery) {
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.domain?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((bookmark) => bookmark.category?.id === selectedCategory);
    }

    if (selectedTag) {
      filtered = filtered.filter((bookmark) => bookmark.tags.some((tag) => tag.id === selectedTag));
    }

    if (showFavorites) {
      filtered = filtered.filter((bookmark) => bookmark.isFavorite);
    }

    // For demo, we'll just update the display without changing the original array
    // In real implementation, this would be handled by the API
  };

  const handleBookmarkAdded = () => {
    toast.success(TOAST_MESSAGES.AUTH_TEMPORARILY_DISABLED);
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    setBookmarks((prev) => prev.map((bookmark) => (bookmark.id === id ? { ...bookmark, isFavorite } : bookmark)));
    toast.success(isFavorite ? TOAST_MESSAGES.ADDED_TO_FAVORITES : TOAST_MESSAGES.REMOVED_FROM_FAVORITES);
  };

  const handleDeleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
    toast.success(TOAST_MESSAGES.BOOKMARK_DELETED);
  };

  const handleCategorySelect = (categoryId?: string) => {
    setSelectedCategory(categoryId);
    setSelectedTag(undefined);
    setShowFavorites(false);
  };

  const handleTagSelect = (tagId?: string) => {
    setSelectedTag(tagId);
    setSelectedCategory(undefined);
    setShowFavorites(false);
  };

  const handleFavoritesToggle = () => {
    setShowFavorites(!showFavorites);
    setSelectedCategory(undefined);
    setSelectedTag(undefined);
  };

  const handleShowAll = () => {
    setSelectedCategory(undefined);
    setSelectedTag(undefined);
    setShowFavorites(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter bookmarks for display
  let displayBookmarks = [...bookmarks];

  if (searchQuery) {
    displayBookmarks = displayBookmarks.filter(
      (bookmark) =>
        bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.domain?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  if (selectedCategory) {
    displayBookmarks = displayBookmarks.filter((bookmark) => bookmark.category?.id === selectedCategory);
  }

  if (selectedTag) {
    displayBookmarks = displayBookmarks.filter((bookmark) => bookmark.tags.some((tag) => tag.id === selectedTag));
  }

  if (showFavorites) {
    displayBookmarks = displayBookmarks.filter((bookmark) => bookmark.isFavorite);
  }

  return (
    <div className="bg-background flex h-screen">
      <Sidebar
        categories={categories}
        tags={tags}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        showFavorites={showFavorites}
        onCategorySelect={handleCategorySelect}
        onTagSelect={handleTagSelect}
        onFavoritesToggle={handleFavoritesToggle}
        onShowAll={handleShowAll}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-1 items-center gap-4">
              <SearchBar onSearch={setSearchQuery} className="max-w-md" />
            </div>

            <AddBookmarkDialog categories={categories} tags={tags} onBookmarkAdded={handleBookmarkAdded} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {displayBookmarks.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No bookmarks found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory || selectedTag || showFavorites
                  ? "Try adjusting your filters or search query"
                  : "This is demo data - auth is temporarily disabled"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteBookmark}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
