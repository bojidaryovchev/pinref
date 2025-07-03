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
import { PLACEHOLDERS, PRESET_TAG_ICONS, TOAST_MESSAGES } from "@/constants";

import { useTags } from "@/hooks/use-api";
import { createTagSchema, Tag } from "@/schemas/tag.schema";
import { Edit, Hash, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const TagManager: React.FC = () => {
  const { tags, isLoading, error, addTag, updateTag, removeTag } = useTags();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "🏷️",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    setFormError(null);
    const parsed = createTagSchema.safeParse(formData);
    if (!parsed.success) {
      setFormError(parsed.error.errors[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      await addTag(parsed.data);
      toast.success(TOAST_MESSAGES.TAG_CREATED);
      setFormData({ name: "", icon: "🏷️" });
      setIsCreating(false);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      icon: tag.icon || "🏷️",
    });
    setFormError(null);
  };

  const handleUpdate = async () => {
    setFormError(null);
    if (!editingTag) return;
    const parsed = createTagSchema.safeParse(formData);
    if (!parsed.success) {
      setFormError(parsed.error.errors[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      await updateTag(editingTag.id, parsed.data);
      toast.success(TOAST_MESSAGES.TAG_UPDATED);
      setEditingTag(null);
      setFormData({ name: "", icon: "🏷️" });
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to update tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    setIsSubmitting(true);
    try {
      await removeTag(tagId);
      toast.success(TOAST_MESSAGES.TAG_DELETED);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TagForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tag Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder={PLACEHOLDERS.TAG_NAME}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label>Icon (Optional)</Label>
        <div className="space-y-3">
          <Input
            value={formData.icon}
            onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder={PLACEHOLDERS.TAG_ICON}
            className="text-center text-lg"
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-10 gap-2">
            {PRESET_TAG_ICONS.map((icon) => (
              <Button
                key={icon}
                variant={formData.icon === icon ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-lg"
                onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                disabled={isSubmitting}
              >
                {icon}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormData((prev) => ({ ...prev, icon: "" }))}
            className="w-full"
            disabled={isSubmitting}
          >
            No Icon
          </Button>
        </div>
      </div>
      {formError && <div className="text-destructive text-sm">{formError}</div>}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setEditingTag(null);
            setFormData({ name: "", icon: "🏷️" });
            setFormError(null);
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onClick={editingTag ? handleUpdate : handleCreate} disabled={isSubmitting}>
          {editingTag ? "Update" : "Create"} Tag
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tags</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to label your bookmarks. Icons are optional and can be any emoji.
              </DialogDescription>
            </DialogHeader>
            <TagForm />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="text-muted-foreground py-8 text-center">Loading tags...</div>}
      {error && <div className="text-destructive py-8 text-center">Failed to load tags</div>}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {tags &&
          tags.length > 0 &&
          tags.map((tag: Tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {tag.icon ? (
                  <span className="text-lg">{tag.icon}</span>
                ) : (
                  <Hash className="text-muted-foreground h-4 w-4" />
                )}
                <div>
                  <p className="font-medium">{tag.name}</p>
                  <p className="text-muted-foreground text-sm">{tag._count?.bookmarks ?? 0} bookmarks</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Dialog open={editingTag?.id === tag.id} onOpenChange={(open) => !open && setEditingTag(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Tag</DialogTitle>
                      <DialogDescription>Update the tag name or icon.</DialogDescription>
                    </DialogHeader>
                    <TagForm />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tag.id)}
                  className="text-destructive hover:text-destructive"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
      </div>

      {!isLoading && (!tags || tags.length === 0) && (
        <div className="text-muted-foreground py-8 text-center">
          <TagIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No tags yet. Create your first tag to get started!</p>
        </div>
      )}
    </div>
  );
};

export default TagManager;
