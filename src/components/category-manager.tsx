"use client";

import { Button } from "@/components/ui/button";
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
import { ERROR_MESSAGES, PLACEHOLDERS, PRESET_COLORS, PRESET_ICONS, TOAST_MESSAGES } from "@/constants";
import { useCategories } from "@/hooks/use-api";
import type { Category } from "@/schemas/category.schema";
import { createCategorySchema } from "@/schemas/category.schema";
import { Edit, Palette, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

const CategoryManager: React.FC = () => {
  const {
    categories = [],
    isLoading,
    error,
    addCategory,
    updateCategory: updateCat,
    removeCategory,
    // refreshCategories,
  } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "📁",
    color: "#3b82f6",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error(ERROR_MESSAGES.CATEGORY_NAME_REQUIRED);
      return;
    }
    try {
      setIsSubmitting(true);
      const parsed = createCategorySchema.parse(formData);
      await addCategory(parsed);
      toast.success(TOAST_MESSAGES.CATEGORY_CREATED);
      setFormData({ name: "", icon: "📁", color: "#3b82f6" });
      setIsCreating(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
  };

  const handleUpdate = async () => {
    if (!formData.name.trim() || !editingCategory) {
      toast.error(ERROR_MESSAGES.CATEGORY_NAME_REQUIRED);
      return;
    }
    try {
      setIsSubmitting(true);
      const parsed = createCategorySchema.parse(formData);
      await updateCat(editingCategory.id, parsed);
      toast.success("Category updated successfully");
      setEditingCategory(null);
      setFormData({ name: "", icon: "📁", color: "#3b82f6" });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsSubmitting(true);
      await removeCategory(id);
      toast.success(TOAST_MESSAGES.CATEGORY_DELETED);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CategoryForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder={PLACEHOLDERS.CATEGORY_NAME}
        />
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="space-y-3">
          <Input
            value={formData.icon}
            onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder={PLACEHOLDERS.CATEGORY_ICON}
            className="text-center text-lg"
          />
          <div className="grid grid-cols-10 gap-2">
            {PRESET_ICONS.map((icon) => (
              <Button
                key={icon}
                variant={formData.icon === icon ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-lg"
                onClick={() => setFormData((prev) => ({ ...prev, icon }))}
              >
                {icon}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border" style={{ backgroundColor: formData.color }} />
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              className="h-8 w-20 p-1"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
          <div className="grid grid-cols-10 gap-2">
            {PRESET_COLORS.map((color) => (
              <Button
                key={color}
                variant="outline"
                size="sm"
                className="h-8 w-8 border-2 p-0"
                style={{
                  backgroundColor: color,
                  borderColor: formData.color === color ? "#000" : "transparent",
                }}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setEditingCategory(null);
            setFormData({ name: "", icon: "📁", color: "#3b82f6" });
          }}
        >
          Cancel
        </Button>
        <Button onClick={editingCategory ? handleUpdate : handleCreate} disabled={isSubmitting}>
          {isSubmitting ? (editingCategory ? "Updating..." : "Creating...") : editingCategory ? "Update" : "Create"}{" "}
          Category
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categories</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your bookmarks. You can use emojis or any Unicode character as icons.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-muted-foreground py-8 text-center">Loading categories...</div>}
        {error && <div className="text-destructive py-8 text-center">Failed to load categories</div>}
        {!isLoading &&
          !error &&
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded font-medium text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-muted-foreground text-sm">{category._count?.bookmarks ?? 0} bookmarks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog
                  open={editingCategory?.id === category.id}
                  onOpenChange={(open) => !open && setEditingCategory(null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Category</DialogTitle>
                      <DialogDescription>Update the category name, icon, or color.</DialogDescription>
                    </DialogHeader>
                    <CategoryForm />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
      </div>

      {categories.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <Palette className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No categories yet. Create your first category to get started!</p>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
