"use client";

import BookmarkCard from "@/components/bookmark-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookmarks } from "@/hooks/use-api";
import { useState } from "react";

export default function BookmarksPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // SWR hook for bookmarks
  const { bookmarks, isLoading, error, refreshBookmarks } = useBookmarks({
    query: searchQuery || undefined,
    isFavorite: isFavorite || undefined,
    limit: 50,
  });

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The SWR hook will automatically refresh with the new query
  };

  // Toggle favorite filter
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

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

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Bookmarks Grid */}
      {bookmarks.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No bookmarks found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}
    </div>
  );
}
