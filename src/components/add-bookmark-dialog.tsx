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
import { ERROR_MESSAGES, PLACEHOLDERS, TOAST_MESSAGES } from "@/constants";
import { useBookmarks } from "@/hooks/use-api";
import { createBookmarkSchema, type CreateBookmarkInput } from "@/schemas/bookmark.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  categories: Array<{ id: string; name: string; icon?: string }>;
  tags: Array<{ id: string; name: string }>;
}

const AddBookmarkDialog: React.FC<Props> = ({ categories, tags }) => {
  const { addBookmark } = useBookmarks();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateBookmarkInput>({
    resolver: zodResolver(createBookmarkSchema),
    defaultValues: {
      url: "",
      categoryId: "",
      tagIds: [],
    },
  });

  // Watch tagIds from form state
  const selectedTags = form.watch("tagIds") || [];

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: CreateBookmarkInput) => {
    setIsLoading(true);
    try {
      await addBookmark(data);
      toast.success(TOAST_MESSAGES.BOOKMARK_ADDED);
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.BOOKMARK_ADD_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = form.getValues("tagIds") || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id: string) => id !== tagId)
      : [...currentTags, tagId];
    form.setValue("tagIds", newTags);
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
            Paste a URL to save it to your bookmarks. We&apos;ll automatically extract title, description, and image.
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
              {form.formState.errors.categoryId && (
                <p className="text-destructive text-sm">{form.formState.errors.categoryId.message}</p>
              )}
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
                      disabled={isLoading}
                    />
                    <Label htmlFor={tag.id} className="text-sm">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.tagIds && (
                <p className="text-destructive text-sm">{form.formState.errors.tagIds.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
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
