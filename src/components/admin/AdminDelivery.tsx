import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  ChevronRight,
  ArrowLeft,
  ImagePlus,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { DEFAULT_DELIVERY_CATEGORIES, DEFAULT_DELIVERY_ITEMS } from "@/lib/mediaDefaults";
import { compressImageClient } from "@/lib/imageCompression";

type Category = {
  id: string;
  name: string;
  icon_url: string | null;
  order_index: number;
  description: string | null;
  visibility: boolean;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  order_index: number;
  visibility: boolean;
};

type Item = {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  image_url: string;
  label: string;
  order_index: number;
  brand: string | null;
  price: number | null;
  description: string | null;
  availability: boolean;
  compatible_bikes: string[];
  instagram_reel_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  tags: string[];
  search_keywords: string[];
  featured: boolean;
  visibility: boolean;
  additional_images: string[];
};

const AdminDelivery = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  // Selection & Navigation
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form inputs
  const [newCatName, setNewCatName] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  
  // States
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingSubcat, setAddingSubcat] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "subcategories">("items");
  const [filterSubcatId, setFilterSubcatId] = useState<string | null>("all");
  const [editSubcategories, setEditSubcategories] = useState<Subcategory[]>([]);

  // Quick Add Product State
  const [quickName, setQuickName] = useState("");
  const [quickBikes, setQuickBikes] = useState("");
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickPreview, setQuickPreview] = useState<string | null>(null);

  const configured = isSupabaseConfigured() && supabase;

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    if (!configured) {
      setLoaded(true);
      return;
    }
    try {
      const { data, error } = await supabase!
        .from("delivery_categories")
        .select("*")
        .order("order_index");
      if (error) {
        toast.error("Failed to fetch categories: " + error.message);
      } else if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error("[AdminDelivery] Fetch categories failed:", err);
    }
    setLoaded(true);
  }, [configured]);

  // Fetch Subcategories
  const fetchSubcategories = useCallback(async (catId: string) => {
    if (!configured) return;
    try {
      const { data, error } = await supabase!
        .from("delivery_subcategories")
        .select("*")
        .eq("category_id", catId)
        .order("order_index");
      if (!error && data) setSubcategories(data);
    } catch (err) {
      console.error("[AdminDelivery] Fetch subcategories failed:", err);
    }
  }, [configured]);

  // Fetch Items
  const fetchItems = useCallback(async (catId: string) => {
    if (!configured) return;
    try {
      const { data, error } = await supabase!
        .from("delivery_items")
        .select("*")
        .eq("category_id", catId)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to fetch items: " + error.message);
      } else if (data) {
        setItems(data);
      }
    } catch (err) {
      console.error("[AdminDelivery] Fetch items failed:", err);
    }
  }, [configured]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (selectedCat) {
      fetchItems(selectedCat.id);
      fetchSubcategories(selectedCat.id);
    }
  }, [selectedCat, fetchItems, fetchSubcategories]);

  useEffect(() => {
    if (editingItem) {
      const loadEditSubcategories = async () => {
        const { data } = await supabase!
          .from("delivery_subcategories")
          .select("*")
          .eq("category_id", editingItem.category_id)
          .order("order_index");
        setEditSubcategories(data || []);
      };
      loadEditSubcategories();
    } else {
      setEditSubcategories([]);
    }
  }, [editingItem]);

  if (!configured) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          Database not configured. Please set Supabase environment variables.
        </p>
      </div>
    );
  }

  // Helper file uploader
  const handleUploadImage = async (pathPrefix: string, file: File): Promise<string | null> => {
    try {
      const compressed = await compressImageClient(file);
      const ext = file.name.split(".").pop();
      const finalExt = file.type.startsWith("image/") ? "jpg" : ext;
      const path = `${pathPrefix}/${Date.now()}.${finalExt}`;
      const { error } = await supabase!.storage.from("uploads").upload(path, compressed);
      if (error) {
        toast.error("Upload failed: " + error.message);
        return null;
      }
      const { data } = supabase!.storage.from("uploads").getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error("[AdminUpload] Error uploading file:", err);
      return null;
    }
  };

  // ─── Category Operations ──────────────────────────────────────────────────
  const addCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase!
        .from("delivery_categories")
        .insert({ name: trimmed, order_index: categories.length });
      if (error) {
        toast.error("Failed to save category: " + error.message);
      } else {
        setNewCatName("");
        await fetchCategories();
        toast.success("Category added");
      }
    } catch (err) {
      console.error("[AdminDelivery] Add category failed:", err);
    }
    setAdding(false);
  };

  const updateCategoryDetails = async (id: string, updates: Partial<Category>) => {
    try {
      const { error } = await supabase!.from("delivery_categories").update(updates).eq("id", id);
      if (error) {
        toast.error("Failed to update category: " + error.message);
      } else {
        await fetchCategories();
      }
    } catch (err) {
      console.error("[AdminDelivery] Update category failed:", err);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? All subcategories and items will be deleted.")) return;
    try {
      const { error } = await supabase!.from("delivery_categories").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete category: " + error.message);
      } else {
        if (selectedCat?.id === id) setSelectedCat(null);
        await fetchCategories();
        toast.success("Category deleted");
      }
    } catch (err) {
      console.error("[AdminDelivery] Delete category failed:", err);
    }
  };

  const uploadCategoryThumbnail = async (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingThumb(catId);
    const file = e.target.files[0];
    const url = await handleUploadImage("delivery/thumbnails", file);
    if (url) {
      await updateCategoryDetails(catId, { icon_url: url });
      toast.success("Thumbnail updated");
    }
    setUploadingThumb(null);
    e.target.value = "";
  };

  // ─── Subcategory Operations ───────────────────────────────────────────────
  const addSubcategory = async () => {
    const trimmed = newSubcatName.trim();
    if (!trimmed || !selectedCat) {
      toast.error("Enter a subcategory name");
      return;
    }
    setAddingSubcat(true);
    try {
      const { error } = await supabase!.from("delivery_subcategories").insert({
        category_id: selectedCat.id,
        name: trimmed,
        order_index: subcategories.length,
      });
      if (error) {
        toast.error("Failed to add subcategory: " + error.message);
      } else {
        setNewSubcatName("");
        await fetchSubcategories(selectedCat.id);
        toast.success("Subcategory added");
      }
    } catch (err) {
      console.error("[AdminDelivery] Add subcategory failed:", err);
    }
    setAddingSubcat(false);
  };

  const updateSubcategoryDetails = async (id: string, updates: Partial<Subcategory>) => {
    try {
      const { error } = await supabase!.from("delivery_subcategories").update(updates).eq("id", id);
      if (error) {
        toast.error("Failed to update subcategory: " + error.message);
      } else if (selectedCat) {
        await fetchSubcategories(selectedCat.id);
      }
    } catch (err) {
      console.error("[AdminDelivery] Update subcategory failed:", err);
    }
  };

  const deleteSubcategory = async (id: string) => {
    toast.info("Processing delete request for subcategory...");
    console.log("[AdminDelivery] deleteSubcategory clicked for ID:", id);
    if (!confirm("Are you sure? Items inside this subcategory will not be deleted but will become unassigned.")) {
      toast.dismiss();
      return;
    }
    try {
      toast.loading("Deleting subcategory...", { id: "subcat-delete" });
      
      // 1. Unassign subcategory_id for any products belonging to this subcategory
      const { error: updateError } = await supabase!
        .from("delivery_items")
        .update({ subcategory_id: null })
        .eq("subcategory_id", id);
      
      if (updateError) {
        console.warn("[AdminDelivery] Warning: Failed to unassign products:", updateError.message);
      }

      // 2. Delete the subcategory itself
      const { error } = await supabase!.from("delivery_subcategories").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete subcategory: " + error.message, { id: "subcat-delete" });
      } else if (selectedCat) {
        await fetchSubcategories(selectedCat.id);
        await fetchItems(selectedCat.id);
        toast.success("Subcategory deleted successfully", { id: "subcat-delete" });
      }
    } catch (err: unknown) {
      console.error("[AdminDelivery] Delete subcategory exception:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("An error occurred during deletion: " + errMsg, { id: "subcat-delete" });
    }
  };

  const uploadSubcategoryCover = async (subId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const url = await handleUploadImage("delivery/subcategories", file);
    if (url) {
      await updateSubcategoryDetails(subId, { cover_image_url: url });
      toast.success("Cover image updated");
    }
    e.target.value = "";
  };

  // ─── Product/Item Operations ──────────────────────────────────────────────
  const addProduct = async (e: React.ChangeEvent<HTMLInputElement>, subcatId: string | null = null) => {
    if (!e.target.files?.length || !selectedCat) return;
    setUploading(true);
    const file = e.target.files[0];
    const url = await handleUploadImage(`delivery/${selectedCat.id}`, file);
    if (url) {
      try {
        const { error } = await supabase!.from("delivery_items").insert({
          category_id: selectedCat.id,
          subcategory_id: subcatId,
          image_url: url,
          label: "New Product",
          order_index: items.length,
          availability: true,
          visibility: true,
          featured: false,
        });
        if (error) {
          toast.error("Failed to add product: " + error.message);
        } else {
          await fetchItems(selectedCat.id);
          toast.success("Product added successfully");
        }
      } catch (err) {
        console.error("[AdminDelivery] Add product failed:", err);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleQuickAddSubmit = async () => {
    if (!quickName.trim() || !quickFile || !selectedCat) return;
    setUploading(true);
    const toastId = toast.loading("Uploading product image...");
    try {
      const url = await handleUploadImage(`delivery/${selectedCat.id}`, quickFile);
      if (url) {
        toast.loading("Saving product details...", { id: toastId });
        const subcatId = filterSubcatId !== "all" && filterSubcatId !== "unassigned" ? filterSubcatId : null;
        
        const { error } = await supabase!.from("delivery_items").insert({
          category_id: selectedCat.id,
          subcategory_id: subcatId,
          image_url: url,
          label: quickName.trim(),
          compatible_bikes: quickBikes.split(",").map(s => s.trim()).filter(Boolean),
          order_index: items.length,
          availability: true,
          visibility: true,
          featured: false,
        });

        if (error) {
          toast.error("Failed to add product: " + error.message, { id: toastId });
        } else {
          toast.success("Product added successfully in under a minute!", { id: toastId });
          setQuickName("");
          setQuickBikes("");
          setQuickFile(null);
          setQuickPreview(null);
          await fetchItems(selectedCat.id);
        }
      } else {
        toast.error("Failed to upload product image", { id: toastId });
      }
    } catch (err) {
      console.error("[AdminDelivery] Quick Add product failed:", err);
      toast.error("An error occurred during quick add", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase!.from("delivery_items").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete item: " + error.message);
      } else if (selectedCat) {
        await fetchItems(selectedCat.id);
        toast.success("Product deleted");
      }
    } catch (err) {
      console.error("[AdminDelivery] Delete item failed:", err);
    }
  };

  const handleUpdateProductSubmit = async (product: Item) => {
    try {
      const { error } = await supabase!
        .from("delivery_items")
        .update({
          label: product.label,
          brand: product.brand,
          price: product.price,
          description: product.description,
          availability: product.availability,
          compatible_bikes: product.compatible_bikes,
          tags: product.tags,
          search_keywords: product.search_keywords,
          featured: product.featured,
          visibility: product.visibility,
          instagram_reel_url: product.instagram_reel_url,
          subcategory_id: product.subcategory_id,
          category_id: product.category_id,
          image_url: product.image_url,
          additional_images: product.additional_images,
        })
        .eq("id", product.id);

      if (error) {
        toast.error("Failed to update product: " + error.message);
      } else {
        toast.success("Product details updated");
        setEditingItem(null);
        if (selectedCat) await fetchItems(selectedCat.id);
      }
    } catch (err) {
      console.error("[AdminDelivery] Update product failed:", err);
    }
  };

  const updateItemDetails = async (id: string, updates: Partial<Item>) => {
    try {
      const { error } = await supabase!.from("delivery_items").update(updates).eq("id", id);
      if (error) {
        toast.error("Failed to update product: " + error.message);
      } else if (selectedCat) {
        await fetchItems(selectedCat.id);
      }
    } catch (err) {
      console.error("[AdminDelivery] Update item failed:", err);
    }
  };

  // Reorder Handler
  const reorderItem = async (item: Item, direction: "up" | "down") => {
    const index = items.findIndex((i) => i.id === item.id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const target = newItems[newIndex];
    newItems[newIndex] = item;
    newItems[index] = target;

    // Apply indexes locally
    setItems(newItems);

    try {
      await Promise.all([
        supabase!.from("delivery_items").update({ order_index: newIndex }).eq("id", item.id),
        supabase!.from("delivery_items").update({ order_index: index }).eq("id", target.id),
      ]);
    } catch (err) {
      console.error("[AdminDelivery] Reordering failed:", err);
    }
  };

  // ─── Sync Default Catalog Fallbacks ───────────────────────────────────────
  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      const categoryIdMap = new Map<string, string>();
      let successCats = 0;

      for (let i = 0; i < DEFAULT_DELIVERY_CATEGORIES.length; i++) {
        const cat = DEFAULT_DELIVERY_CATEGORIES[i];
        const response = await fetch(cat.icon_url);
        const blob = await response.blob();
        const ext = cat.icon_url.includes(".png") ? "png" : "jpg";
        const path = `delivery/thumbnails/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase!.storage.from("uploads").upload(path, blob);
        if (uploadError) continue;

        const { data: urlData } = supabase!.storage.from("uploads").getPublicUrl(path);
        const { data: inserted, error: insertError } = await supabase!
          .from("delivery_categories")
          .insert({
            name: cat.name,
            icon_url: urlData.publicUrl,
            order_index: cat.order_index,
            visibility: true,
          })
          .select("id")
          .single();
        
        if (insertError || !inserted) continue;
        categoryIdMap.set(cat.id, inserted.id);
        successCats++;
      }

      let successItems = 0;
      for (const [fallbackId, itemsList] of Object.entries(DEFAULT_DELIVERY_ITEMS)) {
        const newCatId = categoryIdMap.get(fallbackId);
        if (!newCatId) continue;

        for (let i = 0; i < itemsList.length; i++) {
          const item = itemsList[i];
          const response = await fetch(item.image_url);
          const blob = await response.blob();
          const ext = item.image_url.includes(".png") ? "png" : "jpg";
          const path = `delivery/${newCatId}/${Date.now()}_${i}.${ext}`;
          const { error: uploadError } = await supabase!.storage.from("uploads").upload(path, blob);
          if (uploadError) continue;

          const { data: urlData } = supabase!.storage.from("uploads").getPublicUrl(path);
          await supabase!.from("delivery_items").insert({
            category_id: newCatId,
            image_url: urlData.publicUrl,
            label: item.label,
            order_index: item.order_index,
            availability: true,
            visibility: true,
          });
          successItems++;
        }
      }

      await fetchCategories();
      toast.success(`Synced ${successCats} categories and ${successItems} products successfully`);
    } catch (err) {
      console.error("[AdminDelivery] Sync failed:", err);
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  const showFallback = loaded && categories.length === 0;

  // ─── RENDER DETAILED ITEM EDIT PANEL ─────────────────────────────────────
  if (editingItem) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setEditingItem(null)}
          className="flex items-center gap-1.5 text-xs text-primary font-heading font-semibold mb-4 hover:underline"
        >
          <ArrowLeft size={14} /> Back to Products List
        </button>

        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="font-heading font-bold text-base sm:text-lg">Edit Product</h2>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-heading font-bold">
            ID: {editingItem.id.slice(0, 8)}...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Product Name & Category Assignments */}
          <div className="space-y-4">
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-heading font-black text-primary uppercase tracking-wider pb-2 border-b border-border/10">
                📝 Basic Information
              </h3>
              
              <div>
                <label className="text-[11px] font-heading font-semibold text-muted-foreground uppercase block mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                  placeholder="Enter product name..."
                />
              </div>

              <div>
                <label className="text-[11px] font-heading font-semibold text-muted-foreground uppercase block mb-1">Assign Main Category</label>
                <select
                  value={editingItem.category_id}
                  onChange={async (e) => {
                    const newCatId = e.target.value;
                    setEditingItem({ ...editingItem, category_id: newCatId, subcategory_id: null });
                    if (newCatId) {
                      const { data } = await supabase!
                        .from("delivery_subcategories")
                        .select("*")
                        .eq("category_id", newCatId)
                        .order("order_index");
                      setEditSubcategories(data || []);
                    } else {
                      setEditSubcategories([]);
                    }
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none font-heading font-semibold"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-heading font-semibold text-muted-foreground uppercase block mb-1">Assign Subcategory</label>
                <select
                  value={editingItem.subcategory_id || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, subcategory_id: e.target.value || null })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none font-heading font-semibold"
                >
                  <option value="">— Unassigned / Category Default —</option>
                  {editSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-heading font-black text-primary uppercase tracking-wider pb-2 border-b border-border/10">
                ⚙️ Status & Settings
              </h3>
              
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingItem.visibility}
                  onChange={(e) => setEditingItem({ ...editingItem, visibility: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                Visible to Public (Show / Hide)
              </label>
            </div>
          </div>

          {/* Right Column: Image & Compatibility */}
          <div className="space-y-4">
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-heading font-black text-primary uppercase tracking-wider pb-2 border-b border-border/10">
                🖼️ Product Image
              </h3>
              <div className="relative group border border-dashed border-border hover:border-primary rounded-xl h-44 overflow-hidden bg-muted/40 flex flex-col items-center justify-center cursor-pointer transition-colors">
                {editingItem.image_url ? (
                  <>
                    <img src={editingItem.image_url} alt={editingItem.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-xs font-heading font-bold text-white">Change Product Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 flex flex-col items-center">
                    <ImagePlus size={24} className="text-muted-foreground mb-1" />
                    <span className="text-xs leading-tight text-muted-foreground font-heading font-semibold">Upload Image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (!e.target.files?.length) return;
                    const file = e.target.files[0];
                    const url = await handleUploadImage(`delivery/${editingItem.category_id}`, file);
                    if (url) {
                      setEditingItem({ ...editingItem, image_url: url });
                      toast.success("Product image updated");
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-heading font-black text-primary uppercase tracking-wider pb-2 border-b border-border/10">
                🏍️ Bike Compatibility
              </h3>
              
              <div>
                <label className="text-[11px] font-heading font-semibold text-muted-foreground uppercase block mb-1">
                  Fits Bike Models (Optional, Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MT15, R15 V4, Duke 390"
                  value={editingItem.compatible_bikes.join(", ")}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      compatible_bikes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
                <p className="text-[9px] text-muted-foreground mt-1.5">Separate with commas. E.g. MT15, Duke 390. Leave empty if fits all or not applicable.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-border/20 pt-4">
          <button
            onClick={() => setEditingItem(null)}
            className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => handleUpdateProductSubmit(editingItem)}
            className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-1.5"
          >
            <Check size={14} /> Save Product
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER SINGLE CATEGORY EXPLORER TAB (ITEMS OR SUBCATS) ─────────────
  if (selectedCat) {
    const filteredItems = items.filter((item) => {
      const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubcat =
        filterSubcatId === "all" ||
        (filterSubcatId === "unassigned" && item.subcategory_id === null) ||
        item.subcategory_id === filterSubcatId;
      return matchesSearch && matchesSubcat;
    });

    const activeSubcatName = filterSubcatId !== "all" && filterSubcatId !== "unassigned"
      ? subcategories.find(s => s.id === filterSubcatId)?.name
      : null;

    return (
      <div>
        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedCat(null);
            setFilterSubcatId("all");
          }}
          className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline"
        >
          <ArrowLeft size={14} /> Back to categories
        </button>

        <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg">{selectedCat.name}</h2>
            {selectedCat.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{selectedCat.description}</p>
            )}
          </div>
        </div>

        {/* Tabs: Items | Subcategories */}
        <div className="flex gap-2 mb-4 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab("items")}
            className={`text-xs font-heading font-semibold px-3 py-1.5 rounded-full transition-colors ${activeTab === "items" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Products ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("subcategories")}
            className={`text-xs font-heading font-semibold px-3 py-1.5 rounded-full transition-colors ${activeTab === "subcategories" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Subcategories {subcategories.length > 0 ? `(${subcategories.length})` : ""}
          </button>
        </div>

        {/* ── Subcategory Manager Tab ────────────────────────────── */}
        {activeTab === "subcategories" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New subcategory name..."
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSubcategory(); }}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={addSubcategory} disabled={addingSubcat} className={`bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-heading font-semibold ${addingSubcat ? "opacity-50" : ""}`}>
                Add
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {subcategories.map((sub) => {
                const subcatProductCount = items.filter((item) => item.subcategory_id === sub.id).length;
                return (
                  <div key={sub.id} className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 w-full sm:w-auto">
                      {/* Subcategory cover photo upload */}
                      <div className="relative group border border-dashed border-border hover:border-primary rounded-xl w-20 h-20 overflow-hidden bg-muted/40 shrink-0 flex flex-col items-center justify-center cursor-pointer transition-colors">
                        {sub.cover_image_url ? (
                          <>
                            <img src={sub.cover_image_url} alt={sub.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[9px] font-heading font-bold text-white">Change Pic</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-1 flex flex-col items-center">
                            <ImagePlus size={16} className="text-muted-foreground mb-1" />
                            <span className="text-[8px] leading-tight text-muted-foreground font-heading font-semibold">Upload Cover</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadSubcategoryCover(sub.id, e)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>

                      {/* Text inputs */}
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          defaultValue={sub.name}
                          onBlur={(e) => updateSubcategoryDetails(sub.id, { name: e.target.value })}
                          className="font-heading font-bold text-sm bg-transparent border-none p-0 focus:ring-0 text-foreground w-full focus:bg-muted/40 rounded px-1 -ml-1"
                          placeholder="Subcategory Name"
                        />
                        <input
                          type="text"
                          placeholder="Add short description..."
                          defaultValue={sub.description || ""}
                          onBlur={(e) => updateSubcategoryDetails(sub.id, { description: e.target.value || null })}
                          className="text-xs text-muted-foreground block bg-transparent border-none p-0 focus:ring-0 w-full focus:bg-muted/40 rounded px-1 -ml-1"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-heading font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                            {subcatProductCount} Products
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action controls */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-border/10 pt-3 sm:pt-0">
                      <div className="flex items-center gap-2">
                        {/* View products inside this subcategory */}
                        <button
                          onClick={() => {
                            setFilterSubcatId(sub.id);
                            setActiveTab("items");
                          }}
                          className="flex items-center gap-0.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-colors"
                        >
                          View Products <ChevronRight size={12} />
                        </button>
                      </div>

                      {/* Visibility & Trash */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateSubcategoryDetails(sub.id, { visibility: !sub.visibility })}
                          className="text-muted-foreground hover:text-foreground p-1.5 border border-border rounded-lg bg-card/40 transition-colors"
                          title={sub.visibility ? "Hide subcategory" : "Show subcategory"}
                        >
                          {sub.visibility ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => deleteSubcategory(sub.id)}
                          className="text-secondary p-1.5 border border-border rounded-lg bg-card/40 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                          title="Delete subcategory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {subcategories.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-6">No subcategories yet. Add one above to group products.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Items Tab ─────────────────────────────────────────── */}
        {activeTab === "items" && (
          <>
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products in this category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="shrink-0 min-w-[200px]">
                <select
                  value={filterSubcatId || "all"}
                  onChange={(e) => setFilterSubcatId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-heading font-bold"
                >
                  <option value="all">📁 All Products ({items.length})</option>
                  <option value="unassigned">📦 Unassigned / Main Category</option>
                  {subcategories.map(sub => {
                    const subcatCount = items.filter((item) => item.subcategory_id === sub.id).length;
                    return (
                      <option key={sub.id} value={sub.id}>
                        📂 {sub.name} ({subcatCount})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Quick Add Product Card */}
            <div className="bg-card border border-primary/20 rounded-xl p-4 mb-6 shadow-md">
              <h3 className="text-xs font-heading font-black text-primary uppercase tracking-wider mb-3">
                ⚡ Quick Add Product (Under 1 Minute)
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                {/* Image uploader thumbnail */}
                <div className="relative border border-dashed border-border hover:border-primary rounded-lg w-24 h-24 overflow-hidden bg-muted/40 shrink-0 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  {quickPreview ? (
                    <>
                      <img src={quickPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-heading font-bold text-white">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2 flex flex-col items-center">
                      <ImagePlus size={20} className="text-muted-foreground mb-1" />
                      <span className="text-[8px] leading-tight text-muted-foreground font-heading font-bold">Select Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        const file = e.target.files[0];
                        setQuickFile(file);
                        setQuickPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Form fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div>
                    <label className="text-[9px] font-heading font-bold text-muted-foreground uppercase block mb-1 font-heading font-bold">Product Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Axxis Draken Helmet"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-heading font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-heading font-bold text-muted-foreground uppercase block mb-1 font-heading font-bold">Bike Compatibility (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. R15, MT15, Pulsar"
                      value={quickBikes}
                      onChange={(e) => setQuickBikes(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-heading font-semibold"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleQuickAddSubmit}
                  disabled={uploading || !quickName.trim() || !quickFile}
                  className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-xs font-heading font-bold px-5 py-2.5 rounded-lg h-9 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap w-full md:w-auto"
                >
                  {uploading ? "Uploading..." : <span className="flex items-center gap-1.5"><Plus size={14} /> Upload Product</span>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const subcat = subcategories.find(s => s.id === item.subcategory_id);
                return (
                  <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden flex gap-3 p-3">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted/40 shrink-0 relative bg-muted/20">
                      <img src={item.image_url} alt={item.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-heading font-semibold text-primary uppercase truncate">
                            {subcat ? `📂 ${subcat.name}` : "📦 Category Default"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => updateItemDetails(item.id, { visibility: !item.visibility })}
                              className="text-muted-foreground hover:text-foreground"
                              title={item.visibility ? "Hide product" : "Show product"}
                            >
                              {item.visibility ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="text-secondary hover:opacity-85" title="Delete product">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-sm font-heading font-bold text-foreground line-clamp-1 mt-0.5">
                          {item.label}
                        </h4>
                        {item.compatible_bikes && item.compatible_bikes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.compatible_bikes.map((bike: string) => (
                              <span key={bike} className="text-[8px] font-heading font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                {bike}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end pt-2 border-t border-border/10 mt-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-xs text-primary font-heading font-bold flex items-center gap-1 hover:underline"
                        >
                          <Edit2 size={11} /> Edit Info
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">No products yet. Add your first above.</p>
            )}
            {items.length > 0 && filteredItems.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">No matching products found.</p>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── RENDER CATEGORIES MAIN MANAGER VIEW ─────────────────────────────────
  return (
    <div>
      <h2 className="font-heading font-bold text-base mb-4">Delivery Categories</h2>
      
      {showFallback && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 bg-card border border-primary/30 rounded-lg p-3">
            <div>
              <p className="text-xs font-heading font-semibold text-primary">Default Delivery Photos Showing on Main Page</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sync them to edit categories and items from this panel.</p>
            </div>
            <button
              onClick={handleSyncDefaults}
              disabled={syncing}
              className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading whitespace-nowrap ${syncing ? "opacity-50" : ""}`}
            >
              {syncing ? "Syncing..." : "Sync to DB"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_DELIVERY_CATEGORIES.map((cat) => (
              <div key={cat.id} className="bg-card border border-border border-dashed rounded-lg overflow-hidden opacity-75">
                <img src={cat.icon_url} alt={cat.name} className="w-full h-24 object-cover" />
                <div className="p-2">
                  <p className="text-xs text-muted-foreground">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground/60">Default — sync to edit</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="New category name"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={addCategory} disabled={adding} className={`bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-heading font-bold ${adding ? "opacity-50" : ""}`}>
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted/40 shrink-0">
                {cat.icon_url ? (
                  <img src={cat.icon_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">{cat.name.charAt(0)}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadCategoryThumbnail(cat.id, e)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadingThumb === cat.id}
                />
              </div>

              <div>
                <input
                  type="text"
                  defaultValue={cat.name}
                  onBlur={(e) => updateCategoryDetails(cat.id, { name: e.target.value })}
                  className="font-heading font-bold text-sm bg-transparent border-none p-0 text-foreground"
                />
                <input
                  type="text"
                  placeholder="Optional description..."
                  defaultValue={cat.description || ""}
                  onBlur={(e) => updateCategoryDetails(cat.id, { description: e.target.value || null })}
                  className="text-[10px] text-muted-foreground block bg-transparent border-none p-0 max-w-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCategoryDetails(cat.id, { visibility: !cat.visibility })}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                title={cat.visibility ? "Hide Category" : "Show Category"}
              >
                {cat.visibility ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                onClick={() => setSelectedCat(cat)}
                className="text-primary hover:text-primary/80 p-1"
                title="Manage Products & Subcategories"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-secondary hover:opacity-85 p-1"
                title="Delete Category"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !showFallback && (
        <p className="text-muted-foreground text-sm text-center py-8">No categories yet.</p>
      )}
    </div>
  );
};

export default AdminDelivery;
