"use client";

import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { BookmarkCard } from "@/components/bookmark-card";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";
import { BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Bookmark {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
  isFavorite: boolean;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  tags: {
    id: string;
    name: string;
  }[];
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count: { bookmarks: number };
}

interface Tag {
  id: string;
  name: string;
  _count: { bookmarks: number };
}

export default function Home() {
  // Temporarily disable auth - always show as authenticated
  const session = { user: { id: "temp-user", name: "Demo User", email: "demo@example.com" } };
  const status = "authenticated";

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedTag, setSelectedTag] = useState<string>();
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
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
    // Mock categories
    const mockCategories: Category[] = [
      { id: "1", name: "Development", icon: "💻", color: "#3b82f6", _count: { bookmarks: 5 } },
      { id: "2", name: "Design", icon: "🎨", color: "#8b5cf6", _count: { bookmarks: 3 } },
      { id: "3", name: "News", icon: "📰", color: "#ef4444", _count: { bookmarks: 2 } },
      { id: "4", name: "Learning", icon: "📚", color: "#10b981", _count: { bookmarks: 4 } },
    ];

    // Mock tags
    const mockTags: Tag[] = [
      { id: "1", name: "React", _count: { bookmarks: 3 } },
      { id: "2", name: "JavaScript", _count: { bookmarks: 4 } },
      { id: "3", name: "CSS", _count: { bookmarks: 2 } },
      { id: "4", name: "Tutorial", _count: { bookmarks: 3 } },
      { id: "5", name: "Tools", _count: { bookmarks: 2 } },
    ];

    // Mock bookmarks
    const mockBookmarks: Bookmark[] = [
      {
        id: "1",
        url: "https://react.dev",
        title: "React - The library for web and native user interfaces",
        description: "React lets you build user interfaces out of individual pieces called components.",
        image: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
        favicon: "https://react.dev/favicon.ico",
        domain: "react.dev",
        isFavorite: true,
        category: mockCategories[0],
        tags: [mockTags[0], mockTags[1]],
        createdAt: new Date().toISOString(),
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
        category: mockCategories[1],
        tags: [mockTags[2]],
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        url: "https://nextjs.org",
        title: "Next.js by Vercel - The React Framework",
        description:
          "Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
        image: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
        favicon: "https://nextjs.org/favicon.ico",
        domain: "nextjs.org",
        isFavorite: true,
        category: mockCategories[0],
        tags: [mockTags[0], mockTags[1]],
        createdAt: new Date().toISOString(),
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
        category: mockCategories[1],
        tags: [mockTags[4]],
        createdAt: new Date().toISOString(),
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
        category: mockCategories[3],
        tags: [mockTags[1], mockTags[3]],
        createdAt: new Date().toISOString(),
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
        category: mockCategories[0],
        tags: [mockTags[4]],
        createdAt: new Date().toISOString(),
      },
    ];

    setCategories(mockCategories);
    setTags(mockTags);
    setBookmarks(mockBookmarks);
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
    toast.success("Bookmark functionality will be available once auth is re-enabled");
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    setBookmarks((prev) => prev.map((bookmark) => (bookmark.id === id ? { ...bookmark, isFavorite } : bookmark)));
    toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const handleDeleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
    toast.success("Bookmark deleted");
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
}
