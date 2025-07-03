"use client";

import SettingsDialog from "@/components/settings-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category.interface";
import type { Tag } from "@/types/tag.interface";
import { BookOpen, Filter, Heart, Tag as TagIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface CategoryWithCount extends Category {
  _count: { bookmarks: number };
}

interface TagWithCount extends Tag {
  _count: { bookmarks: number };
}

interface Props {
  categories: CategoryWithCount[];
  tags: TagWithCount[];
  selectedCategory?: string;
  selectedTag?: string;
  showFavorites: boolean;
  onCategorySelect: (categoryId?: string) => void;
  onTagSelect: (tagId?: string) => void;
  onFavoritesToggle: () => void;
  onShowAll: () => void;
}

const Sidebar: React.FC<Props> = ({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  showFavorites,
  onCategorySelect,
  onTagSelect,
  onFavoritesToggle,
  onShowAll,
}: Props) => {
  const [collapsed] = useState(false);

  return (
    <div
      className={cn("bg-card flex h-full flex-col border-r transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <BookOpen className="text-primary-foreground h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold">Bookmarks</h1>
              <p className="text-muted-foreground text-xs">Visual bookmark manager</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Quick Actions */}
        <div className="space-y-2">
          <Button
            variant={!selectedCategory && !selectedTag && !showFavorites ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={onShowAll}
          >
            <Filter className="h-4 w-4" />
            {!collapsed && "All Bookmarks"}
          </Button>

          <Button
            variant={showFavorites ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={onFavoritesToggle}
          >
            <Heart className="h-4 w-4" />
            {!collapsed && "Favorites"}
          </Button>
        </div>

        <Separator />

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-2">
            {!collapsed && (
              <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium">Categories</h3>
              </div>
            )}

            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => onCategorySelect(category.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="truncate">{category.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {category._count.bookmarks}
                        </Badge>
                      </>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="space-y-2">
            {!collapsed && (
              <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium">Tags</h3>
              </div>
            )}

            <div className="space-y-1">
              {tags.slice(0, collapsed ? 3 : 10).map((tag) => (
                <Button
                  key={tag.id}
                  variant={selectedTag === tag.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => onTagSelect(tag.id)}
                >
                  <TagIcon className="h-4 w-4" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{tag.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {tag._count.bookmarks}
                      </Badge>
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="border-t p-4">
        {/* TODO: Enable when auth is ready */}
        {/* {session?.user && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.user.name || session.user.email}</p>
                  <p className="text-muted-foreground truncate text-xs">{session.user.email}</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="flex gap-1">
                <SettingsDialog />
                <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        )} */}
        
        {!collapsed && (
          <div className="flex gap-1">
            <SettingsDialog />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
