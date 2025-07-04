"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRESET_ICONS } from "@/constants";
import { useTags } from "@/hooks/use-api";
import { createTagSchema, type CreateTagInput, type Tag } from "@/schemas/tag.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Hash, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const TagManager: React.FC = () => {
  const { tags, addTag, updateTag, removeTag } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: "",
      icon: "🏷️",
    },
  });

  // Reset form when dialog opens/closes or when editing changes
  const resetForm = () => {
    if (editingTag) {
      form.reset({
        name: editingTag.name,
        icon: editingTag.icon || "🏷️",
      });
    } else {
      form.reset({
        name: "",
        icon: "🏷️",
      });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTag(null);
      resetForm();
    } else {
      resetForm();
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateTagInput) => {
    try {
      setIsSubmitting(true);

      if (editingTag) {
        await updateTag(editingTag.id, data);
        toast.success("Tag updated successfully");
      } else {
        await addTag(data);
        toast.success("Tag created successfully");
      }

      handleDialogOpenChange(false);
    } catch (error) {
      console.error("Error saving tag:", error);
      toast.error(editingTag ? "Failed to update tag" : "Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      setIsSubmitting(true);
      await removeTag(id);
      toast.success("Tag deleted successfully");
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Tags
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTag ? "Edit Tag" : "Create New Tag"}</DialogTitle>
                <DialogDescription>
                  {editingTag ? "Update the tag details below." : "Add a new tag to organize your bookmarks."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tag name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRESET_ICONS.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                <span className="mr-2">{icon}</span>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {editingTag ? "Update" : "Create"} Tag
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-muted-foreground w-full py-4 text-center">No tags yet. Create one to get started!</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{tag.icon}</span>
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-muted-foreground">({tag._count?.bookmarks || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tag)}
                    disabled={isSubmitting}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                    disabled={isSubmitting}
                    className="text-destructive hover:text-destructive h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TagManager;
