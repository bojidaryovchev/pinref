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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      categoryId: "none",
      tagIds: [],
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        url: "",
        categoryId: "none",
        tagIds: [],
      });
    }
  }, [open, form]);

  // Handle form submission with server-side metadata extraction
  const onSubmit = async (data: CreateBookmarkInput) => {
    try {
      setIsLoading(true);

      // Convert "none" categoryId to undefined
      const bookmarkData = {
        ...data,
        categoryId: data.categoryId === "none" ? undefined : data.categoryId,
      };

      // Add bookmark with server-side metadata extraction
      await addBookmark(bookmarkData);

      toast.success("Bookmark added successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag selection
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {categories.length > 0 && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon && <span className="mr-2">{category.icon}</span>}
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tags.length > 0 && (
              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormDescription>Select tags for this bookmark</FormDescription>
                    <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-tag-${tag.id}`}
                            checked={(field.value || []).includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                            disabled={isLoading}
                          />
                          <FormLabel htmlFor={`add-tag-${tag.id}`} className="cursor-pointer text-sm font-normal">
                            {tag.name}
                          </FormLabel>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkDialog;
