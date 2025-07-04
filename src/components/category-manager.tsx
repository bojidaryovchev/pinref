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
import { PRESET_COLORS, PRESET_ICONS } from "@/constants";
import { useCategories } from "@/hooks/use-api";
import { createCategorySchema, type Category, type CreateCategoryInput } from "@/schemas/category.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Palette, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const CategoryManager: React.FC = () => {
  const { categories, addCategory, updateCategory, removeCategory } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      icon: "📁",
      color: "#3b82f6",
    },
  });

  // Reset form when dialog opens/closes or when editing changes
  const resetForm = () => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        icon: editingCategory.icon || "📁",
        color: editingCategory.color || "#3b82f6",
      });
    } else {
      form.reset({
        name: "",
        icon: "📁",
        color: "#3b82f6",
      });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingCategory(null);
      resetForm();
    } else {
      resetForm();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateCategoryInput) => {
    try {
      setIsSubmitting(true);

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("Category updated successfully");
      } else {
        await addCategory(data);
        toast.success("Category created successfully");
      }

      handleDialogOpenChange(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(editingCategory ? "Failed to update category" : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      setIsSubmitting(true);
      await removeCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Categories
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Update the category details below."
                    : "Add a new category to organize your bookmarks."}
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
                          <Input placeholder="Enter category name" {...field} />
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

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <div className="grid grid-cols-6 gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`h-8 w-8 rounded border-2 ${
                                field.value === color ? "border-foreground" : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
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
                      {editingCategory ? "Update" : "Create"} Category
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No categories yet. Create one to get started!</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-sm">{category.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-muted-foreground text-sm">{category._count?.bookmarks || 0} bookmarks</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(category)} disabled={isSubmitting}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={isSubmitting}
                    className="text-destructive hover:text-destructive"
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

export default CategoryManager;
