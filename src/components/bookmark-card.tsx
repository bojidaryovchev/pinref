"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBookmarks } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import type { Bookmark } from "@/schemas/bookmark.schema";
import { Edit, ExternalLink, Folder, Heart, Tag, Trash2 } from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";
import toast from "react-hot-toast";

interface Props {
  bookmark: Bookmark;
  categories?: Array<{ id: string; name: string; icon?: string }>;
  tags?: Array<{ id: string; name: string; icon?: string }>;
  onEdit?: (bookmark: Bookmark) => void;
}

const BookmarkCard: React.FC<Props> = ({ bookmark, categories = [], tags = [], onEdit }) => {
  const [imageError, setImageError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { removeBookmark, toggleFavorite } = useBookmarks();

  const handleImageError = () => setImageError(true);

  // Get category and tag names
  const category = categories.find((c) => c.id === bookmark.categoryId);
  const bookmarkTags = bookmark.tagIds?.map((tagId) => tags.find((t) => t.id === tagId)).filter(Boolean) || [];

  const handleFavoriteToggle = async () => {
    setIsProcessing(true);
    try {
      await toggleFavorite(bookmark.id, !bookmark.isFavorite);
      toast.success(bookmark.isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to update favorite");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsProcessing(true);
    try {
      await removeBookmark(bookmark.id);
      toast.success("Bookmark deleted");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete bookmark");
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5">
      <div className="relative">
        {bookmark.image && !imageError ? (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={bookmark.image}
              alt={bookmark.title || "Bookmark image"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center">
              {bookmark.favicon ? (
                <Image src={bookmark.favicon} alt="Favicon" width={32} height={32} className="mx-auto mb-2 rounded" />
              ) : (
                <ExternalLink className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
              )}
              <p className="text-muted-foreground text-sm font-medium">{bookmark.domain}</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-2 right-2 h-8 w-8 p-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            bookmark.isFavorite && "opacity-100",
          )}
          onClick={handleFavoriteToggle}
          disabled={isProcessing}
          aria-label={bookmark.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              bookmark.isFavorite ? "fill-red-500 text-red-500" : "text-white hover:text-red-500",
            )}
          />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-base leading-tight font-semibold">{bookmark.title || bookmark.domain}</h3>

            {bookmark.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{bookmark.description}</p>
            )}
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {bookmark.favicon && (
              <Image src={bookmark.favicon} alt="Favicon" width={16} height={16} className="rounded" />
            )}
            <span className="truncate">{bookmark.domain}</span>
          </div>

          {/* Show category and tag details with actual names */}
          {(category || bookmarkTags.length > 0) && (
            <div className="space-y-2">
              {category && (
                <div className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </Badge>
                </div>
              )}
              {bookmarkTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {bookmarkTags.slice(0, 2).map((tag) => (
                    <Badge key={tag?.id} variant="outline" className="text-xs">
                      {tag?.name}
                    </Badge>
                  ))}
                  {bookmarkTags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{bookmarkTags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Visit
            </a>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEdit?.(bookmark)}
                aria-label="Edit bookmark"
                disabled={isProcessing}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0",
                  showDeleteConfirm
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "text-destructive hover:text-destructive",
                )}
                onClick={handleDelete}
                disabled={isProcessing}
                aria-label={showDeleteConfirm ? "Confirm delete" : "Delete bookmark"}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {showDeleteConfirm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-500"
                  onClick={() => setShowDeleteConfirm(false)}
                  aria-label="Cancel delete"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(BookmarkCard);
