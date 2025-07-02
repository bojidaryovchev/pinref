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
import { Edit, Hash, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Tag {
  id: string;
  name: string;
  icon?: string;
  _count: { bookmarks: number };
}

interface TagManagerProps {
  tags: Tag[];
  onUpdate: () => void;
}

const PRESET_TAG_ICONS = [
  "🏷️",
  "⭐",
  "🔥",
  "💡",
  "🎯",
  "📌",
  "🚀",
  "💎",
  "🎨",
  "🔧",
  "📚",
  "💻",
  "🎵",
  "🎮",
  "🏠",
  "💼",
  "🍔",
  "✈️",
  "🏃",
  "📱",
];

export function TagManager({ tags, onUpdate }: TagManagerProps) {
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "🏷️",
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    // In real implementation, this would call the API
    toast.success("Tag created successfully");
    setFormData({ name: "", icon: "🏷️" });
    setIsCreating(false);
    onUpdate();
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      icon: tag.icon || "🏷️",
    });
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    // In real implementation, this would call the API
    toast.success("Tag updated successfully");
    setEditingTag(null);
    setFormData({ name: "", icon: "🏷️" });
    onUpdate();
  };

  const handleDelete = (tagId: string) => {
    // In real implementation, this would call the API
    toast.success("Tag deleted successfully");
    onUpdate();
  };

  const TagForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tag Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter tag name"
        />
      </div>

      <div className="space-y-2">
        <Label>Icon (Optional)</Label>
        <div className="space-y-3">
          <Input
            value={formData.icon}
            onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder="Enter emoji or leave empty"
            className="text-center text-lg"
          />
          <div className="grid grid-cols-10 gap-2">
            {PRESET_TAG_ICONS.map((icon) => (
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormData((prev) => ({ ...prev, icon: "" }))}
            className="w-full"
          >
            No Icon
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setEditingTag(null);
            setFormData({ name: "", icon: "🏷️" });
          }}
        >
          Cancel
        </Button>
        <Button onClick={editingTag ? handleUpdate : handleCreate}>{editingTag ? "Update" : "Create"} Tag</Button>
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

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {tag.icon ? (
                <span className="text-lg">{tag.icon}</span>
              ) : (
                <Hash className="text-muted-foreground h-4 w-4" />
              )}
              <div>
                <p className="font-medium">{tag.name}</p>
                <p className="text-muted-foreground text-sm">{tag._count.bookmarks} bookmarks</p>
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
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <TagIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No tags yet. Create your first tag to get started!</p>
        </div>
      )}
    </div>
  );
}
