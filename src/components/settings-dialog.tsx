"use client";

import CategoryManager from "@/components/category-manager";
import TagManager from "@/components/tag-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Palette, Settings, Shield, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

const SettingsDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    encryptData: true,
    autoExtractMetadata: true,
    showFavicons: true,
    compactView: false,
    darkMode: false,
    ngramSearch: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success("Setting updated");
  };

  const handleExportData = () => {
    toast.success("Data export started - this would download your encrypted bookmarks");
  };

  const handleImportData = () => {
    toast.success("Import functionality - this would allow uploading bookmark files");
  };

  const handleClearCache = () => {
    toast.success("Cache cleared");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your bookmark preferences, categories, tags, and security settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="gap-2">
              <User className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Palette className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <Database className="h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Preferences</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-extract metadata</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically fetch title, description, and images from URLs
                  </p>
                </div>
                <Switch
                  checked={settings.autoExtractMetadata}
                  onCheckedChange={(checked) => handleSettingChange("autoExtractMetadata", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show favicons</Label>
                  <p className="text-muted-foreground text-sm">Display website favicons in bookmark cards</p>
                </div>
                <Switch
                  checked={settings.showFavicons}
                  onCheckedChange={(checked) => handleSettingChange("showFavicons", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact view</Label>
                  <p className="text-muted-foreground text-sm">Show more bookmarks in a smaller layout</p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => handleSettingChange("compactView", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>N-gram search</Label>
                  <p className="text-muted-foreground text-sm">
                    Enable advanced partial text matching for better search results
                  </p>
                </div>
                <Switch
                  checked={settings.ngramSearch}
                  onCheckedChange={(checked) => handleSettingChange("ngramSearch", checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <TagManager />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Protection</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encrypt sensitive data</Label>
                  <p className="text-muted-foreground text-sm">
                    Encrypt URLs, titles, descriptions, categories, and tags
                  </p>
                </div>
                <Switch
                  checked={settings.encryptData}
                  onCheckedChange={(checked) => handleSettingChange("encryptData", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Encryption Details</h4>
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>• URLs are encrypted to protect your browsing patterns</p>
                  <p>• Bookmark titles and descriptions are encrypted</p>
                  <p>• Category and tag names are encrypted</p>
                  <p>• N-gram search tokens are hashed for privacy-preserving search</p>
                  <p>• Metadata images and favicons are stored as references only</p>
                </div>
              </div>

              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Encryption is enabled by default. Disabling it will decrypt existing data on
                  next sync. This action cannot be undone.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Management</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Button onClick={handleExportData} variant="outline" className="gap-2">
                  <Database className="h-4 w-4" />
                  Export Bookmarks
                </Button>

                <Button onClick={handleImportData} variant="outline" className="gap-2">
                  <Database className="h-4 w-4" />
                  Import Bookmarks
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Search & Performance</h4>
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>• N-gram indexing enables partial text matching</p>
                  <p>• Search tokens are generated for titles, descriptions, and domains</p>
                  <p>• Encrypted search maintains privacy while enabling functionality</p>
                </div>
                <Button onClick={handleClearCache} variant="outline" size="sm">
                  Rebuild Search Index
                </Button>
              </div>

              <Separator />

              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">Danger Zone</h4>
                <p className="mb-3 text-sm text-red-700 dark:text-red-300">
                  These actions cannot be undone. Please be careful.
                </p>
                <Button variant="destructive" size="sm">
                  Delete All Data
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
