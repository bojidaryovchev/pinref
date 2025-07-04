"use client";

import BookmarkCard from "@/components/bookmark-card";
import EditBookmarkDialog from "@/components/edit-bookmark-dialog";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookmarks, useCategories, useTags } from "@/hooks/use-api";
import type { Bookmark } from "@/schemas/bookmark.schema";
import { useCallback, useMemo, useState } from "react";

export default function BookmarksPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Edit state
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // SWR hooks for data
  const { bookmarks, isLoading, error, refreshBookmarks } = useBookmarks({
    query: searchQuery || undefined,
    isFavorite: isFavorite || undefined,
    limit: 50,
  });

  const { categories } = useCategories();
  const { tags } = useTags();

  // Handle search with debouncing (handled by SearchBar component)
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Toggle favorite filter
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  // Handle edit bookmark
  const handleEditBookmark = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setEditDialogOpen(true);
  }, []);

  // Handle edit dialog close
  const handleEditDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setEditingBookmark(null);
    }
    setEditDialogOpen(open);
  }, []);

  // Memoize bookmark cards to prevent unnecessary re-renders
  const bookmarkCards = useMemo(() => {
    return bookmarks.map((bookmark) => (
      <BookmarkCard
        key={bookmark.id}
        bookmark={bookmark}
        categories={categories}
        tags={tags}
        onEdit={handleEditBookmark}
      />
    ));
  }, [bookmarks, categories, tags, handleEditBookmark]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>There was an error loading your bookmarks.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error.message || "Unknown error occurred"}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={refreshBookmarks}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <Button variant={isFavorite ? "default" : "outline"} onClick={handleToggleFavorite}>
          {isFavorite ? "All Bookmarks" : "Favorites Only"}
        </Button>
      </div>

      {/* Search Bar with debouncing */}
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} placeholder="Search bookmarks..." className="w-full" />
      </div>

      {/* Bookmarks Grid */}
      {bookmarks.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? "No bookmarks found for your search." : "No bookmarks found."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{bookmarkCards}</div>
      )}

      {/* Edit Bookmark Dialog */}
      <EditBookmarkDialog
        bookmark={editingBookmark}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
