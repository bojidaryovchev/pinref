"use client";


import AddBookmarkDialog from "@/components/add-bookmark-dialog";
import BookmarkCard from "@/components/bookmark-card";
import SearchBar from "@/components/search-bar";
import Sidebar from "@/components/sidebar";
import { BookOpen, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
// import toast from "react-hot-toast";
import { useBookmarks, useCategories, useTags } from "@/hooks/use-api";



const Home: React.FC = () => {

  const { status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedTag, setSelectedTag] = useState<string>();
  const [showFavorites, setShowFavorites] = useState(false);

  // SWR hooks for all data
  const {
    bookmarks,
    isLoading: bookmarksLoading,
    // error: bookmarksError,
    // addBookmark,
    // removeBookmark,
    // toggleFavorite,
  } = useBookmarks({
    query: searchQuery || undefined,
    categoryId: selectedCategory,
    tagId: selectedTag,
    isFavorite: showFavorites || undefined,
    limit: 100,
  });
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { tags, isLoading: tagsLoading } = useTags();

  const loading = bookmarksLoading || categoriesLoading || tagsLoading || (status === "loading");

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
    setShowFavorites((prev) => !prev);
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

  // Bookmarks are already filtered by SWR hook
  const displayBookmarks = bookmarks;

  return (
    <div className="bg-background flex h-screen">
      <Sidebar
        categories={categories.map(c => ({ ...c, _count: c._count || { bookmarks: 0 } }))}
        tags={tags.map(t => ({ ...t, _count: t._count || { bookmarks: 0 } }))}
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

            <AddBookmarkDialog categories={categories} tags={tags} />
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
                  : "You have no bookmarks yet. Click 'Add Bookmark' to get started!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  categories={categories?.map(c => ({ id: c.id, name: c.name, icon: c.icon }))}
                  tags={tags?.map(t => ({ id: t.id, name: t.name, icon: t.icon }))}
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
