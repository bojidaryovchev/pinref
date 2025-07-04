"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBookmarks } from "@/hooks/use-api";
import type { Bookmark } from "@/schemas/bookmark.schema";
import { updateBookmarkSchema, type UpdateBookmarkInput } from "@/schemas/bookmark.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  bookmark: Bookmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string; icon?: string }>;
  tags: Array<{ id: string; name: string }>;
}

const EditBookmarkDialog: React.FC<Props> = ({ bookmark, open, onOpenChange, categories, tags }) => {
  const { updateBookmark } = useBookmarks();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateBookmarkInput>({
    resolver: zodResolver(updateBookmarkSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      tagIds: [],
      isFavorite: false,
    },
  });

  // Reset form when bookmark changes
  useEffect(() => {
    if (bookmark) {
      form.reset({
        title: bookmark.title || "",
        description: bookmark.description || "",
        categoryId: bookmark.categoryId || "",
        tagIds: bookmark.tagIds || [],
        isFavorite: bookmark.isFavorite || false,
      });
    }
  }, [bookmark, form]);

  // Handle form submission
  const handleSubmit = async (data: UpdateBookmarkInput) => {
    if (!bookmark) return;

    try {
      setIsLoading(true);
      await updateBookmark(bookmark.id, data);
      toast.success("Bookmark updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const currentTags = form.getValues("tagIds") || [];
    const newTags = currentTags.includes(tagId) ? currentTags.filter((id) => id !== tagId) : [...currentTags, tagId];
    form.setValue("tagIds", newTags);
  };

  if (!bookmark) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bookmark</DialogTitle>
          <DialogDescription>Update the bookmark details below.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bookmark title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter bookmark description" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
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

            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormDescription>Select tags for this bookmark</FormDescription>
                  <div className="grid grid-cols-2 gap-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-tag-${tag.id}`}
                          checked={(field.value || []).includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                          disabled={isLoading}
                        />
                        <FormLabel htmlFor={`edit-tag-${tag.id}`} className="cursor-pointer text-sm font-normal">
                          {tag.name}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Mark as favorite</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Bookmark
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookmarkDialog;
