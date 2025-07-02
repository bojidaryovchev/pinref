"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookmarkSchema, type BookmarkSchemaData } from "@/schemas/bookmark.schema";
import { ERROR_MESSAGES, PLACEHOLDERS, TOAST_MESSAGES } from "@/constants";
import type { Category } from "@/types/category.interface";
import type { Tag } from "@/types/tag.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  categories: Category[];
  tags: Tag[];
  onBookmarkAdded: () => void;
}

const AddBookmarkDialog: React.FC<Props> = ({ categories, tags, onBookmarkAdded }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const form = useForm<BookmarkSchemaData>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      url: "",
      categoryId: "",
      tagIds: [],
    },
  });

  const onSubmit = async (data: BookmarkSchemaData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tagIds: selectedTags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add bookmark");
      }

      toast.success(TOAST_MESSAGES.BOOKMARK_ADDED);
      form.reset();
      setSelectedTags([]);
      setOpen(false);
      onBookmarkAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.BOOKMARK_ADD_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bookmark
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
          <DialogDescription>
            Paste a URL to save it to your bookmarks. We'll automatically extract title, description, and image.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" placeholder={PLACEHOLDERS.URL_INPUT} {...form.register("url")} />
            {form.formState.errors.url && (
              <p className="text-destructive text-sm">{form.formState.errors.url.message}</p>
            )}
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={form.watch("categoryId")} onValueChange={(value) => form.setValue("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={PLACEHOLDERS.SELECT_CATEGORY} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag.id}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Label htmlFor={tag.id} className="text-sm">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Bookmark
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkDialog;
