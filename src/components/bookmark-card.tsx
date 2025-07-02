"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Edit, ExternalLink, Folder, Heart, Tag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface BookmarkCardProps {
  bookmark: {
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
  };
  onEdit?: (bookmark: any) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
}

export function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite }: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFavoriteToggle = () => {
    onToggleFavorite?.(bookmark.id, !bookmark.isFavorite);
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

          {(bookmark.category || bookmark.tags.length > 0) && (
            <div className="space-y-2">
              {bookmark.category && (
                <div className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: `${bookmark.category.color}20` }}
                  >
                    <span className="mr-1">{bookmark.category.icon}</span>
                    {bookmark.category.name}
                  </Badge>
                </div>
              )}

              {bookmark.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {bookmark.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                  {bookmark.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{bookmark.tags.length - 2}
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
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit?.(bookmark)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                onClick={() => onDelete?.(bookmark.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
