import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw, Image as ImageIcon, X, Instagram, Edit3, GripVertical, FolderPlus } from "lucide-react";
import { DEFAULT_GALLERY_CATEGORIES, DEFAULT_GALLERY_IMAGES } from "@/lib/mediaDefaults";
import { compressImageClient } from "@/lib/imageCompression";

type GalleryItem = {
  id: string;
  category: string;
  image_url: string;
  order_index: number;
  before_image_url: string | null;
  before_image_alt: string | null;
  after_image_alt: string | null;
  before_label: string | null;
  after_label: string | null;
  comparison_enabled: boolean;
  instagram_post_url: string | null;
  label: string;
  compatible_bikes: string[];
};

type GalleryCategory = {
  id: string;
  name: string;
  order_index: number;
};

const validateInstagramUrl = (url: string): boolean => {
  if (!url) return true; // allow empty
  try {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes("instagram.com/p/") || trimmed.includes("instagram.com/reel/") || trimmed.includes("instagram.com/tv/");
  } catch {
    return false;
  }
};

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [dbCategoriesAvailable, setDbCategoriesAvailable] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // --- Tab management state ---
  const [showTabManager, setShowTabManager] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // --- Add form state ---
  const [addAfterFile, setAddAfterFile] = useState<File | null>(null);
  const [addBeforeFile, setAddBeforeFile] = useState<File | null>(null);
  const [addBeforeLabel, setAddBeforeLabel] = useState("Before");
  const [addAfterLabel, setAddAfterLabel] = useState("After");
  const [addComparison, setAddComparison] = useState(false);
  const [addInstagramUrl, setAddInstagramUrl] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addCompatibleBikes, setAddCompatibleBikes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // --- Edit state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBeforeFile, setEditBeforeFile] = useState<File | null>(null);
  const [editBeforeLabel, setEditBeforeLabel] = useState("Before");
  const [editAfterLabel, setEditAfterLabel] = useState("After");
  const [editComparison, setEditComparison] = useState(false);
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editCompatibleBikes, setEditCompatibleBikes] = useState("");

  // Get effective category names for tab display
  const effectiveCategoryNames = dbCategoriesAvailable && categories.length > 0
    ? categories.map((c) => c.name)
    : DEFAULT_GALLERY_CATEGORIES;

  const fetchCategories = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase
        .from("gallery_categories")
        .select("*")
        .order("order_index");

      if (!error && data) {
        setCategories(data as GalleryCategory[]);
        setDbCategoriesAvailable(true);
        // Auto-select first category if none selected
        if (!selectedCat && data.length > 0) {
          setSelectedCat(data[0].name);
        }
      } else {
        // Table doesn't exist on remote — use defaults
        setDbCategoriesAvailable(false);
        if (!selectedCat) {
          setSelectedCat(DEFAULT_GALLERY_CATEGORIES[0]);
        }
      }
    } catch {
      setDbCategoriesAvailable(false);
      if (!selectedCat) {
        setSelectedCat(DEFAULT_GALLERY_CATEGORIES[0]);
      }
    }
  }, [selectedCat]);

  const fetchItems = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("[AdminGallery] Fetch error:", error);
        toast.error("Failed to load gallery: " + error.message);
        setLoaded(true);
        return;
      }
      if (data) setItems(data as GalleryItem[]);
    } catch (err) {
      console.error("[AdminGallery] Fetch failed:", err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [fetchCategories, fetchItems]);

  if (!isSupabaseConfigured() || !supabase) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Database not configured. Please set Supabase environment variables.</p>
        <div className="mt-4">
          <p className="text-xs font-heading font-semibold text-primary mb-2">Main Page Currently Shows These Default Images:</p>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_GALLERY_IMAGES.map((img, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border border-dashed opacity-75">
                <img src={img.src} alt={img.cat} className="w-full h-32 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">{img.cat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filtered = items.filter((i) => i.category === selectedCat);
  const fallbackFiltered = DEFAULT_GALLERY_IMAGES.filter((img) => img.cat === selectedCat);
  const showFallback = loaded && items.length === 0;

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    const compressed = await compressImageClient(file);
    const ext = file.name.split(".").pop();
    const finalExt = file.type.startsWith("image/") ? "jpg" : ext;
    const path = `gallery/${prefix}_${Date.now()}.${finalExt}`;
    const { error } = await supabase.storage.from("uploads").upload(path, compressed);
    if (error) {
      toast.error("Upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  // ==================== TAB MANAGEMENT ====================

  const handleAddTab = async () => {
    const trimmed = newTabName.trim();
    if (!trimmed) {
      toast.error("Tab name cannot be empty");
      return;
    }
    if (effectiveCategoryNames.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A tab with this name already exists");
      return;
    }

    if (!dbCategoriesAvailable) {
      // Seed defaults first, then add the new one
      await seedDefaultCategories();
    }

    const maxOrder = categories.length > 0
      ? Math.max(...categories.map((c) => c.order_index)) + 1
      : effectiveCategoryNames.length;

    const { error } = await supabase.from("gallery_categories").insert({
      name: trimmed,
      order_index: maxOrder,
    });

    if (error) {
      toast.error("Failed to add tab: " + error.message);
      return;
    }

    setNewTabName("");
    await fetchCategories();
    toast.success(`Tab "${trimmed}" added!`);
  };

  const handleRenameTab = async (cat: GalleryCategory) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error("Tab name cannot be empty");
      return;
    }
    if (trimmed === cat.name) {
      setRenamingId(null);
      return;
    }
    if (effectiveCategoryNames.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c !== cat.name)) {
      toast.error("A tab with this name already exists");
      return;
    }

    // Update the category name
    const { error: catError } = await supabase
      .from("gallery_categories")
      .update({ name: trimmed })
      .eq("id", cat.id);

    if (catError) {
      toast.error("Failed to rename tab: " + catError.message);
      return;
    }

    // Update all gallery items that reference the old category name
    const { error: itemsError } = await supabase
      .from("gallery")
      .update({ category: trimmed })
      .eq("category", cat.name);

    if (itemsError) {
      console.error("[AdminGallery] Failed to update image categories:", itemsError);
      // Non-fatal — the tab itself was renamed
    }

    if (selectedCat === cat.name) {
      setSelectedCat(trimmed);
    }

    setRenamingId(null);
    await fetchCategories();
    await fetchItems();
    toast.success(`Tab renamed to "${trimmed}"!`);
  };

  const handleDeleteTab = async (cat: GalleryCategory) => {
    const imagesInCat = items.filter((i) => i.category === cat.name);
    if (imagesInCat.length > 0) {
      toast.error(`Cannot delete "${cat.name}" — it has ${imagesInCat.length} image(s). Move or delete them first.`);
      return;
    }

    const { error } = await supabase
      .from("gallery_categories")
      .delete()
      .eq("id", cat.id);

    if (error) {
      toast.error("Failed to delete tab: " + error.message);
      return;
    }

    if (selectedCat === cat.name) {
      const remaining = categories.filter((c) => c.id !== cat.id);
      setSelectedCat(remaining.length > 0 ? remaining[0].name : "");
    }

    await fetchCategories();
    toast.success(`Tab "${cat.name}" deleted!`);
  };

  const seedDefaultCategories = async (): Promise<boolean> => {
    try {
      for (let i = 0; i < DEFAULT_GALLERY_CATEGORIES.length; i++) {
        await supabase.from("gallery_categories").insert({
          name: DEFAULT_GALLERY_CATEGORIES[i],
          order_index: i,
        });
      }
      await fetchCategories();
      return true;
    } catch {
      return false;
    }
  };

  // Ensure categories are in DB before any edit operation
  const ensureCategoriesInDb = async (): Promise<boolean> => {
    if (dbCategoriesAvailable) return true;
    const ok = await seedDefaultCategories();
    if (!ok) {
      toast.error("Failed to initialize category table. The database migration may need to be run first.");
    }
    return ok;
  };

  // ==================== GALLERY IMAGE OPERATIONS ====================

  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      let successCount = 0;
      for (let i = 0; i < DEFAULT_GALLERY_IMAGES.length; i++) {
        const img = DEFAULT_GALLERY_IMAGES[i];
        const response = await fetch(img.src);
        const blob = await response.blob();
        const ext = img.src.includes(".png") ? "png" : "jpg";
        const path = `gallery/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(path, blob);
        if (uploadError) {
          console.error("Upload failed for gallery image", i, uploadError);
          continue;
        }
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        const { error: insertError } = await supabase.from("gallery").insert({
          category: img.cat,
          image_url: urlData.publicUrl,
          order_index: i,
          label: (img as { label?: string }).label ?? `${img.cat} Custom Design`,
          compatible_bikes: (img as { compatible_bikes?: string[] }).compatible_bikes ?? [],
        });
        if (insertError) {
          console.error("Insert failed for gallery image", i, insertError);
          continue;
        }
        successCount++;
      }
      await fetchItems();
      if (successCount === DEFAULT_GALLERY_IMAGES.length) {
        toast.success("Default gallery images synced to database!");
      } else if (successCount > 0) {
        toast.success(`Synced ${successCount}/${DEFAULT_GALLERY_IMAGES.length} images`);
      } else {
        toast.error("Sync failed — could not upload any images");
      }
    } catch (err) {
      console.error("[AdminGallery] Sync failed:", err);
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  const resetAddForm = () => {
    setAddAfterFile(null);
    setAddBeforeFile(null);
    setAddBeforeLabel("Before");
    setAddAfterLabel("After");
    setAddComparison(false);
    setAddInstagramUrl("");
    setAddLabel("");
    setAddCompatibleBikes("");
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!addAfterFile) {
      toast.error("Please select an After image");
      return;
    }
    if (addInstagramUrl && !validateInstagramUrl(addInstagramUrl)) {
      toast.error("Invalid Instagram URL. Must include instagram.com/p/ or /reel/");
      return;
    }

    setUploading(true);
    try {
      const afterUrl = await uploadFile(addAfterFile, "after");
      if (!afterUrl) { setUploading(false); return; }

      let beforeUrl: string | null = null;
      if (addBeforeFile && addComparison) {
        beforeUrl = await uploadFile(addBeforeFile, "before");
        if (!beforeUrl) { setUploading(false); return; }
      }

      const hasComparison = addComparison && !!beforeUrl;
      const bikeArray = addCompatibleBikes
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const { error: insertError } = await supabase.from("gallery").insert({
        category: selectedCat,
        image_url: afterUrl,
        order_index: filtered.length,
        before_image_url: hasComparison ? beforeUrl : null,
        before_label: hasComparison ? (addBeforeLabel || "Before") : null,
        after_label: hasComparison ? (addAfterLabel || "After") : null,
        comparison_enabled: hasComparison,
        instagram_post_url: addInstagramUrl ? addInstagramUrl.trim() : null,
        label: addLabel.trim(),
        compatible_bikes: bikeArray,
      });
      if (insertError) {
        toast.error("Failed to save image: " + insertError.message);
        setUploading(false);
        return;
      }
      await fetchItems();
      toast.success("Added!");
      resetAddForm();
    } catch (err) {
      console.error("[AdminGallery] Add failed:", err);
      toast.error("Failed to add image");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) { toast.error("Failed to delete: " + error.message); return; }
      await fetchItems();
      toast.success("Deleted");
    } catch (err) {
      console.error("[AdminGallery] Delete failed:", err);
      toast.error("Failed to delete");
    }
  };

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditBeforeFile(null);
    setEditBeforeLabel(item.before_label || "Before");
    setEditAfterLabel(item.after_label || "After");
    setEditComparison(item.comparison_enabled && !!item.before_image_url);
    setEditInstagramUrl(item.instagram_post_url || "");
    setEditLabel(item.label || "");
    setEditCompatibleBikes((item.compatible_bikes || []).join(", "));
  };

  const handleEditSave = async (item: GalleryItem) => {
    if (editInstagramUrl && !validateInstagramUrl(editInstagramUrl)) {
      toast.error("Invalid Instagram URL. Must include instagram.com/p/ or /reel/");
      return;
    }

    setUploading(true);
    try {
      let beforeUrl = item.before_image_url;
      if (editBeforeFile) {
        const url = await uploadFile(editBeforeFile, "before");
        if (!url) { setUploading(false); return; }
        beforeUrl = url;
      }

      const hasComparison = editComparison && !!beforeUrl;
      const bikeArray = editCompatibleBikes
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const { error } = await supabase.from("gallery").update({
        before_image_url: hasComparison ? beforeUrl : null,
        before_label: hasComparison ? (editBeforeLabel || "Before") : null,
        after_label: hasComparison ? (editAfterLabel || "After") : null,
        comparison_enabled: hasComparison,
        instagram_post_url: editInstagramUrl ? editInstagramUrl.trim() : null,
        label: editLabel.trim(),
        compatible_bikes: bikeArray,
      }).eq("id", item.id);

      if (error) {
        toast.error("Failed to update: " + error.message);
        setUploading(false);
        return;
      }
      await fetchItems();
      toast.success("Updated!");
      setEditingId(null);
    } catch (err) {
      console.error("[AdminGallery] Edit save failed:", err);
      toast.error("Failed to update");
    }
    setUploading(false);
  };

  const handleRemoveBefore = async (item: GalleryItem) => {
    try {
      const { error } = await supabase.from("gallery").update({
        before_image_url: null,
        before_label: null,
        after_label: null,
        comparison_enabled: false,
      }).eq("id", item.id);
      if (error) {
        toast.error("Failed to remove before image: " + error.message);
        return;
      }
      await fetchItems();
      toast.success("Before image removed");
      setEditingId(null);
    } catch (err) {
      console.error("[AdminGallery] Remove before failed:", err);
      toast.error("Failed to remove");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-base">Gallery</h2>
        <button
          onClick={() => setShowTabManager(!showTabManager)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-colors ${
            showTabManager
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderPlus size={14} />
          Manage Tabs
        </button>
      </div>

      {/* ==================== TAB MANAGER PANEL ==================== */}
      {showTabManager && (
        <div className="mb-6 bg-card border border-primary/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-heading font-semibold text-primary">Gallery Tab Manager</p>
            <button onClick={() => setShowTabManager(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Existing tabs list — always editable */}
          <div className="space-y-1.5">
            {(dbCategoriesAvailable ? categories : DEFAULT_GALLERY_CATEGORIES.map((name, i) => ({ id: `default-${i}`, name, order_index: i } as GalleryCategory))).map((cat) => {
              const imageCount = items.filter((i) => i.category === cat.name).length;
              const isDefault = !dbCategoriesAvailable;
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 group"
                >
                  <GripVertical size={12} className="text-muted-foreground/50 flex-shrink-0" />

                  {renamingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            if (isDefault) {
                              const ok = await ensureCategoriesInDb();
                              if (!ok) return;
                              const fresh = categories.find((c) => c.name === cat.name);
                              if (fresh) handleRenameTab(fresh);
                            } else {
                              handleRenameTab(cat);
                            }
                          }
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="flex-1 bg-background border border-primary/50 rounded px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          if (isDefault) {
                            const ok = await ensureCategoriesInDb();
                            if (!ok) return;
                            const fresh = categories.find((c) => c.name === cat.name);
                            if (fresh) handleRenameTab(fresh);
                          } else {
                            handleRenameTab(cat);
                          }
                        }}
                        className="text-primary text-[10px] font-semibold hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="text-muted-foreground text-[10px] hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-xs font-heading text-foreground">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground">{imageCount} img{imageCount !== 1 ? "s" : ""}</span>
                      <button
                        onClick={() => {
                          setRenamingId(cat.id);
                          setRenameValue(cat.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-0.5"
                        title="Rename tab"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={async () => {
                          if (isDefault) {
                            const ok = await ensureCategoriesInDb();
                            if (!ok) return;
                            const fresh = categories.find((c) => c.name === cat.name);
                            if (fresh) handleDeleteTab(fresh);
                          } else {
                            handleDeleteTab(cat);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-0.5"
                        title={imageCount > 0 ? "Delete images first" : "Delete tab"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add new tab */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTab();
              }}
              placeholder="New tab name (e.g. Underbelly)"
              className="flex-1 bg-muted border-none rounded-full px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
            />
            <button
              onClick={handleAddTab}
              disabled={!newTabName.trim()}
              className={`inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading ${!newTabName.trim() ? "opacity-50" : ""}`}
            >
              <Plus size={12} /> Add Tab
            </button>
          </div>
        </div>
      )}

      {/* ==================== CATEGORY TAB SELECTOR ==================== */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {effectiveCategoryNames.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap ${
              selectedCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add button / form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer mb-4"
        >
          <Plus size={14} /> Add to {selectedCat}
        </button>
      ) : (
        <div className="mb-4 bg-card border border-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-heading font-semibold text-primary">Add New Image</p>
            <button onClick={resetAddForm} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* After image (required) */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">After Image (Required)</p>
            <label className="inline-flex items-center gap-1.5 bg-muted text-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer">
              <ImageIcon size={14} /> {addAfterFile ? addAfterFile.name : "Choose file"}
              <input type="file" accept="image/*" onChange={(e) => setAddAfterFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          {/* Before image (optional) */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Before Image (Optional)</p>
            <label className="inline-flex items-center gap-1.5 bg-muted text-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer">
              <ImageIcon size={14} /> {addBeforeFile ? addBeforeFile.name : "Choose file"}
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setAddBeforeFile(f);
                if (f) setAddComparison(true);
                else setAddComparison(false);
              }} className="hidden" />
            </label>
          </div>

          {/* Comparison options (only shown when before image exists) */}
          {addBeforeFile && (
            <div className="space-y-2 pl-1">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={addComparison}
                  onChange={(e) => setAddComparison(e.target.checked)}
                  className="rounded border-border"
                />
                Enable Before/After Comparison
              </label>
              {addComparison && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addBeforeLabel}
                    onChange={(e) => setAddBeforeLabel(e.target.value)}
                    placeholder="Before label"
                    className="flex-1 bg-muted border-none rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={addAfterLabel}
                    onChange={(e) => setAddAfterLabel(e.target.value)}
                    placeholder="After label"
                    className="flex-1 bg-muted border-none rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}

          {/* Label/Title (optional) */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Label / Title (Optional)</p>
            <input
              type="text"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              placeholder="e.g. Yamaha R15 Neon Wrap"
              className="w-full bg-muted border-none rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Compatible Bikes (optional) */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Compatible Bikes (Optional, comma-separated)</p>
            <input
              type="text"
              value={addCompatibleBikes}
              onChange={(e) => setAddCompatibleBikes(e.target.value)}
              placeholder="e.g. Duke, KTM, 390"
              className="w-full bg-muted border-none rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Instagram Post/Reel URL (optional) */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Instagram Post/Reel URL (Optional)</p>
            <input
              type="text"
              value={addInstagramUrl}
              onChange={(e) => setAddInstagramUrl(e.target.value)}
              placeholder="e.g. https://www.instagram.com/reel/CODE/"
              className="w-full bg-muted border-none rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {addInstagramUrl && (
              <div className="text-[10px] mt-1">
                {validateInstagramUrl(addInstagramUrl) ? (
                  <span className="text-primary">✓ Valid Instagram URL</span>
                ) : (
                  <span className="text-secondary">✗ Invalid Instagram URL (must contain instagram.com/p/ or /reel/)</span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={uploading || !addAfterFile}
            className={`inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading ${uploading || !addAfterFile ? "opacity-50" : ""}`}
          >
            <Plus size={14} /> {uploading ? "Uploading..." : "Save"}
          </button>
        </div>
      )}

      {showFallback && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 bg-card border border-primary/30 rounded-lg p-3">
            <div>
              <p className="text-xs font-heading font-semibold text-primary">Default Images Showing on Main Page</p>
              <p className="text-xs text-muted-foreground mt-0.5">These pre-existing images are currently visible to visitors. Sync them to manage from here.</p>
            </div>
            <button
              onClick={handleSyncDefaults}
              disabled={syncing}
              className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading whitespace-nowrap ${syncing ? "opacity-50" : ""}`}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync to DB"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fallbackFiltered.map((img, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border border-dashed opacity-75">
                <img src={img.src} alt={img.cat} className="w-full h-32 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Default — sync to edit</p>
                </div>
              </div>
            ))}
            {fallbackFiltered.length === 0 && (
              <p className="text-muted-foreground text-xs col-span-2 text-center py-4">No default images in this category.</p>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="relative rounded-lg overflow-hidden border border-border">
              <img src={item.image_url} alt="Motorcycle modification gallery image" className="w-full h-32 object-cover" />
              {/* B/A badge */}
              {item.comparison_enabled && item.before_image_url && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  B/A
                </span>
              )}
              {/* Reel badge */}
              {item.instagram_post_url && (
                <span className="absolute top-1 left-10 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Instagram size={8} /> Reel
                </span>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  onClick={() => startEdit(item)}
                  className="bg-background/80 p-1 rounded-full text-muted-foreground hover:text-foreground"
                  title="Edit comparison and social links"
                >
                  <ImageIcon size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-background/80 p-1 rounded-full text-secondary hover:text-foreground"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Inline edit panel */}
              {editingId === item.id && (
                <div className="absolute inset-0 bg-background/95 p-2 flex flex-col gap-1.5 overflow-y-auto">
                  <p className="text-[10px] font-heading font-semibold text-primary">Edit Item Options</p>

                  {item.before_image_url && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground flex-1 truncate">Has before image</span>
                      <button onClick={() => handleRemoveBefore(item)} className="text-secondary text-[10px] hover:underline">Remove</button>
                    </div>
                  )}

                  <label className="inline-flex items-center gap-1 bg-muted text-foreground px-2 py-1 rounded text-[10px] font-heading cursor-pointer justify-center w-full">
                    <ImageIcon size={10} /> {editBeforeFile ? "Change Before" : "Add Before Image"}
                    <input type="file" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setEditBeforeFile(f);
                      if (f) setEditComparison(true);
                    }} className="hidden" />
                  </label>

                  {(item.before_image_url || editBeforeFile) && (
                    <>
                      <label className="flex items-center gap-1 text-[10px] text-foreground cursor-pointer">
                        <input type="checkbox" checked={editComparison} onChange={(e) => setEditComparison(e.target.checked)} className="rounded border-border" />
                        Enable B/A Slider
                      </label>
                      {editComparison && (
                        <div className="flex gap-1">
                          <input type="text" value={editBeforeLabel} onChange={(e) => setEditBeforeLabel(e.target.value)} placeholder="Before" className="flex-1 bg-muted border-none rounded px-1.5 py-0.5 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          <input type="text" value={editAfterLabel} onChange={(e) => setEditAfterLabel(e.target.value)} placeholder="After" className="flex-1 bg-muted border-none rounded px-1.5 py-0.5 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      )}
                    </>
                  )}

                  {/* Label / Title Edit */}
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[9px] text-muted-foreground font-semibold">LABEL / TITLE</p>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Title"
                      className="w-full bg-muted border-none rounded px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Compatible Bikes Edit */}
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[9px] text-muted-foreground font-semibold">COMPATIBLE BIKES (COMMA-SEPARATED)</p>
                    <input
                      type="text"
                      value={editCompatibleBikes}
                      onChange={(e) => setEditCompatibleBikes(e.target.value)}
                      placeholder="e.g. Duke, KTM"
                      className="w-full bg-muted border-none rounded px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Instagram Edit Field */}
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[9px] text-muted-foreground font-semibold">INSTAGRAM LINK</p>
                    <input
                      type="text"
                      value={editInstagramUrl}
                      onChange={(e) => setEditInstagramUrl(e.target.value)}
                      placeholder="instagram.com/reel/..."
                      className="w-full bg-muted border-none rounded px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {editInstagramUrl && (
                      <p className="text-[8px]">
                        {validateInstagramUrl(editInstagramUrl) ? (
                          <span className="text-primary">✓ URL ok</span>
                        ) : (
                          <span className="text-secondary">✗ URL invalid</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 mt-auto pt-2">
                    <button onClick={() => handleEditSave(item)} disabled={uploading} className={`flex-1 bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] font-heading ${uploading ? "opacity-50" : ""}`}>
                      {uploading ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-muted text-foreground px-2 py-1 rounded text-[10px] font-heading">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 col-span-2">No images in this category.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
