import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw, Image as ImageIcon, X, Instagram } from "lucide-react";
import { DEFAULT_SIGNATURE_WORK } from "@/lib/mediaDefaults";

type SignatureItem = {
  id: string;
  image_url: string;
  label: string;
  order_index: number;
  before_image_url: string | null;
  before_image_alt: string | null;
  after_image_alt: string | null;
  before_label: string | null;
  after_label: string | null;
  comparison_enabled: boolean;
  instagram_post_url: string | null;
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

const AdminSignatureWork = () => {
  const [items, setItems] = useState<SignatureItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // --- Add form state ---
  const [addAfterFile, setAddAfterFile] = useState<File | null>(null);
  const [addBeforeFile, setAddBeforeFile] = useState<File | null>(null);
  const [addBeforeLabel, setAddBeforeLabel] = useState("Before");
  const [addAfterLabel, setAddAfterLabel] = useState("After");
  const [addComparison, setAddComparison] = useState(false);
  const [addInstagramUrl, setAddInstagramUrl] = useState("");
  const [addItemLabel, setAddItemLabel] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // --- Edit state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBeforeFile, setEditBeforeFile] = useState<File | null>(null);
  const [editBeforeLabel, setEditBeforeLabel] = useState("Before");
  const [editAfterLabel, setEditAfterLabel] = useState("After");
  const [editComparison, setEditComparison] = useState(false);
  const [editInstagramUrl, setEditInstagramUrl] = useState("");

  const fetchItems = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase.from("signature_work").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("[AdminSignatureWork] Fetch error:", error);
        toast.error("Failed to load signature work: " + error.message);
        setLoaded(true);
        return;
      }
      if (data) setItems(data as SignatureItem[]);
    } catch (err) {
      console.error("[AdminSignatureWork] Fetch failed:", err);
    }
    setLoaded(true);
  };

  useEffect(() => { fetchItems(); }, []);

  if (!isSupabaseConfigured() || !supabase) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Database not configured. Please set Supabase environment variables.</p>
        <div className="mt-4">
          <p className="text-xs font-heading font-semibold text-primary mb-2">Main Page Currently Shows These Default Images:</p>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_SIGNATURE_WORK.map((item, idx) => (
              <div key={idx} className="bg-card border border-border border-dashed rounded-lg overflow-hidden opacity-75">
                <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const uploadImage = async (file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `signature/${prefix}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      let successCount = 0;
      for (let i = 0; i < DEFAULT_SIGNATURE_WORK.length; i++) {
        const item = DEFAULT_SIGNATURE_WORK[i];
        const response = await fetch(item.image_url);
        const blob = await response.blob();
        const ext = item.image_url.includes(".png") ? "png" : "jpg";
        const path = `signature/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(path, blob);
        if (uploadError) {
          console.error("Upload failed for", item.label, uploadError);
          continue;
        }
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        const { error: insertError } = await supabase.from("signature_work").insert({
          image_url: urlData.publicUrl,
          label: item.label,
          order_index: i,
        });
        if (insertError) {
          console.error("Insert failed for", item.label, insertError);
          continue;
        }
        successCount++;
      }
      await fetchItems();
      if (successCount === DEFAULT_SIGNATURE_WORK.length) {
        toast.success("Default images synced to database!");
      } else if (successCount > 0) {
        toast.success(`Synced ${successCount}/${DEFAULT_SIGNATURE_WORK.length} images`);
      } else {
        toast.error("Sync failed — could not upload any images");
      }
    } catch (err) {
      console.error("[AdminSignatureWork] Sync failed:", err);
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
    setAddItemLabel("");
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
      const afterUrl = await uploadImage(addAfterFile, "after");
      if (!afterUrl) { setUploading(false); return; }

      let beforeUrl: string | null = null;
      if (addBeforeFile && addComparison) {
        beforeUrl = await uploadImage(addBeforeFile, "before");
        if (!beforeUrl) { setUploading(false); return; }
      }

      const hasComparison = addComparison && !!beforeUrl;

      const { error } = await supabase.from("signature_work").insert({
        image_url: afterUrl,
        label: addItemLabel,
        order_index: items.length,
        before_image_url: hasComparison ? beforeUrl : null,
        before_label: hasComparison ? (addBeforeLabel || "Before") : null,
        after_label: hasComparison ? (addAfterLabel || "After") : null,
        comparison_enabled: hasComparison,
        instagram_post_url: addInstagramUrl ? addInstagramUrl.trim() : null,
      });
      if (error) {
        toast.error("Failed to save image: " + error.message);
        setUploading(false);
        return;
      }
      await fetchItems();
      toast.success("Added!");
      resetAddForm();
    } catch (err) {
      console.error("[AdminSignatureWork] Add failed:", err);
      toast.error("Failed to add image");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("signature_work").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete: " + error.message);
        return;
      }
      await fetchItems();
      toast.success("Deleted");
    } catch (err) {
      console.error("[AdminSignatureWork] Delete failed:", err);
      toast.error("Failed to delete");
    }
  };

  const handleLabelChange = async (id: string, label: string) => {
    try {
      const { error } = await supabase.from("signature_work").update({ label }).eq("id", id);
      if (error) console.error("[AdminSignatureWork] Label update error:", error);
    } catch (err) {
      console.error("[AdminSignatureWork] Label update failed:", err);
    }
  };

  const startEdit = (item: SignatureItem) => {
    setEditingId(item.id);
    setEditBeforeFile(null);
    setEditBeforeLabel(item.before_label || "Before");
    setEditAfterLabel(item.after_label || "After");
    setEditComparison(item.comparison_enabled && !!item.before_image_url);
    setEditInstagramUrl(item.instagram_post_url || "");
  };

  const handleEditSave = async (item: SignatureItem) => {
    if (editInstagramUrl && !validateInstagramUrl(editInstagramUrl)) {
      toast.error("Invalid Instagram URL. Must include instagram.com/p/ or /reel/");
      return;
    }

    setUploading(true);
    try {
      let beforeUrl = item.before_image_url;
      if (editBeforeFile) {
        const url = await uploadImage(editBeforeFile, "before");
        if (!url) { setUploading(false); return; }
        beforeUrl = url;
      }

      const hasComparison = editComparison && !!beforeUrl;

      const { error } = await supabase.from("signature_work").update({
        before_image_url: hasComparison ? beforeUrl : null,
        before_label: hasComparison ? (editBeforeLabel || "Before") : null,
        after_label: hasComparison ? (editAfterLabel || "After") : null,
        comparison_enabled: hasComparison,
        instagram_post_url: editInstagramUrl ? editInstagramUrl.trim() : null,
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
      console.error("[AdminSignatureWork] Edit save failed:", err);
      toast.error("Failed to update");
    }
    setUploading(false);
  };

  const handleRemoveBefore = async (item: SignatureItem) => {
    try {
      const { error } = await supabase.from("signature_work").update({
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
      console.error("[AdminSignatureWork] Remove before failed:", err);
      toast.error("Failed to remove");
    }
  };

  const showFallback = loaded && items.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-base">Signature Work</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer`}
          >
            <Plus size={14} /> Add Image
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 bg-card border border-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-heading font-semibold text-primary">Add New Image</p>
            <button onClick={resetAddForm} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Label */}
          <input
            type="text"
            value={addItemLabel}
            onChange={(e) => setAddItemLabel(e.target.value)}
            placeholder="Label (e.g., Custom Paint & Wrap)"
            className="w-full bg-muted border-none rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

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

          {/* Comparison options */}
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
            {DEFAULT_SIGNATURE_WORK.map((item, idx) => (
              <div key={idx} className="bg-card border border-border border-dashed rounded-lg overflow-hidden opacity-75">
                <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Default — sync to edit</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden relative">
              <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
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
              </div>
              <div className="p-2 space-y-1">
                <input
                  type="text"
                  defaultValue={item.label}
                  placeholder="Label..."
                  onBlur={(e) => handleLabelChange(item.id, e.target.value)}
                  className="w-full bg-muted border-none rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1 text-secondary text-xs hover:underline">
                  <Trash2 size={12} /> Delete
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
        </div>
      )}
    </div>
  );
};

export default AdminSignatureWork;
