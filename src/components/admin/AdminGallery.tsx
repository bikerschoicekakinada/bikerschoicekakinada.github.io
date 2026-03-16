import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import { DEFAULT_GALLERY_CATEGORIES, DEFAULT_GALLERY_IMAGES } from "@/lib/mediaDefaults";

type GalleryItem = {
  id: string;
  category: string;
  image_url: string;
  order_index: number;
};

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState(DEFAULT_GALLERY_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from("gallery").select("*").order("order_index");
      if (error) {
        console.error("[AdminGallery] Fetch error:", error);
        toast.error("Failed to load gallery: " + error.message);
        setLoaded(true);
        return;
      }
      if (data) setItems(data);
    } catch (err) {
      console.error("[AdminGallery] Fetch failed:", err);
    }
    setLoaded(true);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((i) => i.category === selectedCat);
  const fallbackFiltered = DEFAULT_GALLERY_IMAGES.filter((img) => img.cat === selectedCat);
  const showFallback = loaded && items.length === 0;

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

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      const { error: insertError } = await supabase.from("gallery").insert({ category: selectedCat, image_url: data.publicUrl, order_index: filtered.length });
      if (insertError) { toast.error("Failed to save image: " + insertError.message); setUploading(false); return; }
      await fetchItems();
      toast.success("Added!");
    } catch (err) {
      console.error("[AdminGallery] Add failed:", err);
      toast.error("Failed to add image");
    }
    setUploading(false);
    e.target.value = "";
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

  return (
    <div>
      <h2 className="font-heading font-bold text-base mb-4">Gallery</h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {DEFAULT_GALLERY_CATEGORIES.map((cat) => (
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
      <label className={`inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer mb-4 ${uploading ? "opacity-50" : ""}`}>
        <Plus size={14} /> Add to {selectedCat}
        <input type="file" accept="image/*" onChange={handleAdd} className="hidden" disabled={uploading} />
      </label>

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
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-1 right-1 bg-background/80 p-1 rounded-full text-secondary hover:text-foreground"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 col-span-2">No images in this category.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
