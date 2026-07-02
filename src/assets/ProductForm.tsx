import React, { useState, useRef, useEffect } from "react";
import { Package, Barcode, PlusCircle, Sparkles, UploadCloud, Image as ImageIcon, Trash2, X } from "lucide-react";

interface ProductFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  categories: string[];
}

export default function ProductForm({ onSubmit, categories }: ProductFormProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [sizeVariant, setSizeVariant] = useState("");
  const [category, setCategory] = useState(categories[0] || "Accessories");
  const [sellPrice, setSellPrice] = useState("");
  const [minStock, setMinStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Product Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageObjectURL, setImageObjectURL] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registered snapshot capture state
  const [lastRegisteredInfo, setLastRegisteredInfo] = useState<{
    name: string;
    brand: string;
    sku: string;
    sizeVariant: string;
    barcode: string;
    category: string;
    sellPrice: number;
    imageObjectURL: string | null;
  } | null>(null);

  // Sync default category if the categories list changes
  useEffect(() => {
    if (categories && categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // Clean up Object URL on unmount to safeguard memory
  useEffect(() => {
    return () => {
      if (imageObjectURL) {
        URL.revokeObjectURL(imageObjectURL);
      }
      if (lastRegisteredInfo?.imageObjectURL) {
        URL.revokeObjectURL(lastRegisteredInfo.imageObjectURL);
      }
    };
  }, [imageObjectURL, lastRegisteredInfo?.imageObjectURL]);

  // Quick generator for SKU & Barcode based on product categories
  const generateIdentifiers = () => {
    const random8 = Math.floor(10000000 + Math.random() * 90000000);
    const newBarcode = `890${random8}11`;
    
    const catCode = category.substring(0, 3).toUpperCase();
    const cleanName = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "") : "ITM";
    const random3 = Math.floor(100 + Math.random() * 900);
    const newSku = `${catCode}-${cleanName}-${random3}`;

    setSku(newSku);
    setBarcode(newBarcode);
  };

  const handleImageChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.png, .jpg, .jpeg, .webp).");
      return;
    }
    
    // Max size constraint: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large (maximum size is 5MB).");
      return;
    }

    setImageFile(file);
    if (imageObjectURL) {
      URL.revokeObjectURL(imageObjectURL);
    }
    setImageObjectURL(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    if (imageObjectURL) {
      URL.revokeObjectURL(imageObjectURL);
      setImageObjectURL(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError("Please specify a valid product name.");
      return;
    }
    if (!sku.trim()) {
      setError("SKU is required. Try using the quick generator button!");
      return;
    }
    if (!brand.trim()) {
      setError("Brand is required.");
      return;
    }
    if (!sizeVariant.trim()) {
      setError("Size / variant is required.");
      return;
    }

    const sellNum = Number(sellPrice);
    const minStockNum = Number(minStock) || 0;

    if (isNaN(sellNum) || sellNum <= 0) {
      setError("Sell Price must be a valid positive number.");
      return;
    }

    setLoading(true);

    // Build FormData to send text values along with multipart image binary file
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("sku", sku.trim().toUpperCase());
    formData.append("brand", brand.trim());
    formData.append("sizeVariant", sizeVariant.trim());
    formData.append("barcode", barcode.trim());
    formData.append("category", category);
    formData.append("buyPrice", "0"); // Default buy price is not utilized
    formData.append("sellPrice", String(sellNum));
    formData.append("minStock", String(minStockNum));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const isOk = await onSubmit(formData);

      if (isOk) {
        // Create an isolated Object URL specifically for the success card so it survives resetting!
        const successUrl = imageFile ? URL.createObjectURL(imageFile) : null;
        
        // Clean up previous success URL to safeguard memory leak
        if (lastRegisteredInfo?.imageObjectURL) {
          URL.revokeObjectURL(lastRegisteredInfo.imageObjectURL);
        }

        setLastRegisteredInfo({
          name: name.trim(),
          brand: brand.trim(),
          sku: sku.trim().toUpperCase(),
          sizeVariant: sizeVariant.trim(),
          barcode: barcode.trim(),
          category,
          sellPrice: sellNum,
          imageObjectURL: successUrl
        });

        setSuccess(true);
        setName("");
        setSku("");
        setBarcode("");
        setBrand("");
        setSizeVariant("");
        setSellPrice("");
        setMinStock("");
        removeSelectedImage();
        setTimeout(() => setSuccess(false), 8000); // Allow ample time to read and confirm
      } else {
        setError("Failed to create product. Check if product SKU code already exists in catalog.");
      }
    } catch (err: any) {
      setError(err.message || "Network submission error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-205 p-6 shadow-xs" id="product-creation-form-wrapper">
      <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100" id="form-heading">
        <div className="p-2 bg-slate-50 rounded border border-slate-200 text-cyan-555">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Register New Equipment</h3>
          <p className="text-[11px] text-slate-450">Create a product identity first, then register stock intake separately.</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-slate-700" id="item-insertion-form">
        {/* Error notification wrapper */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs py-2.5 px-3 rounded border border-red-200 font-sans" id="form-error">
            {error}
          </div>
        )}

        {/* Dynamic Catalog Photo Capture & Verification Success Seal Card */}
        {success && lastRegisteredInfo && (
          <div className="bg-slate-50 border border-cyan-500/30 p-4 rounded-xl flex flex-col sm:flex-row gap-5 items-center justify-between relative overflow-hidden animate-fade-in" id="form-success-captured">
            {/* Shutter capture flash lens decoration */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-400"></div>
            
            <div className="flex gap-4 items-center w-full">
              <div className="w-14 h-14 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow relative">
                {lastRegisteredInfo.imageObjectURL ? (
                  <img
                    src={lastRegisteredInfo.imageObjectURL}
                    alt={lastRegisteredInfo.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-cyan-600/90 text-[6px] font-bold uppercase text-white text-center py-0.5 font-sans tracking-widest leading-none">
                  CAPTURED
                </div>
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-100 text-cyan-800 border border-cyan-200 text-[8px] font-bold uppercase font-sans tracking-widest px-1.5 py-0.5 rounded">
                    Auto-Captured Camera Asset
                  </span>
                  <span className="text-[10px] text-slate-450">EAN: {lastRegisteredInfo.barcode}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 truncate max-w-[280px]">{lastRegisteredInfo.name}</h4>
                <p className="text-[10px] text-slate-500">
                  Brand: <span className="font-mono">{lastRegisteredInfo.brand}</span> | Variant: {lastRegisteredInfo.sizeVariant} | SKU: <span className="font-mono">{lastRegisteredInfo.sku}</span> | Category: {lastRegisteredInfo.category}
                </p>
                <p className="text-[10px] text-emerald-650 font-medium">
                  ✨ Registered Successfully! Auto-captured image thumbnail saved instantly to local state directory.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid layout - Details on left, image upload on right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="product-form-split-grid">
          
          {/* Main Details Panel (Cols span 2) */}
          <div className="md:col-span-2 space-y-4" id="product-details-group">
            {/* Input: Item Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Steelbird SBA-17 Vision Shield Helmet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs text-slate-800 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/10 transition placeholder-slate-450"
                id="product-input-name"
                required
              />
            </div>

            {/* Grid: Category and Generator trigger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  id="product-input-category"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-slate-800">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Quick Identifier Tool</label>
                <button
                  type="button"
                  onClick={generateIdentifiers}
                  className="w-full text-xs font-bold bg-slate-100 text-slate-700 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  id="btn-quick-generators"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Generate SKU & Barcode
                </button>
              </div>
            </div>

            {/* Grid: Brand & Variant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Brand *</label>
                <input
                  type="text"
                  placeholder="Axor"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-xs text-slate-800 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/10 transition placeholder-slate-450"
                  id="product-input-brand"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Size / Variant *</label>
                <input
                  type="text"
                  placeholder="Helmet L"
                  value={sizeVariant}
                  onChange={(e) => setSizeVariant(e.target.value)}
                  className="w-full text-xs text-slate-800 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/10 transition placeholder-slate-450"
                  id="product-input-variant"
                  required
                />
              </div>
            </div>

            {/* Grid: SKU & Barcode inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">SKU Code *</label>
                <input
                  type="text"
                  placeholder="HLM-SB-017"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs font-mono text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-505 uppercase"
                  id="product-input-sku"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Barcode (Optional)</label>
                <div className="relative flex items-center">
                  <Barcode className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="8901234567017"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-505"
                    id="product-input-barcode"
                  />
                </div>
              </div>
            </div>

            {/* Grid: Sell price and Stock limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Sell Price (Retail) *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[11px] font-bold text-slate-400 font-sans">Rs</span>
                  <input
                    type="number"
                    placeholder="1850"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 pl-9 pr-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-505"
                    id="product-input-sellprice"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Min Threshold</label>
                <input
                  type="number"
                  placeholder="5"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full text-xs font-mono text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-505"
                  id="product-input-minstock"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Product Image Uploader Panel (Cols span 1) */}
          <div className="space-y-2 flex flex-col" id="product-uploader-group">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">
              Product Image Support
            </span>

            {/* Img input slot */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && e.target.files[0] && handleImageChange(e.target.files[0])}
              id="product-image-file-input"
            />

            {/* Main Interactive Droparea drag & drop panel */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`flex-1 min-h-[180px] rounded-xl border border-dashed flex flex-col justify-center items-center p-4 transition-all relative overflow-hidden group cursor-pointer ${
                imageObjectURL
                  ? "border-slate-300 bg-slate-50 hover:border-cyan-500"
                  : isDragActive
                  ? "border-cyan-500 bg-cyan-50 scale-[0.99] shadow-inner"
                  : "border-slate-250 bg-slate-50 hover:bg-slate-100 hover:border-cyan-455"
              }`}
              id="image-drop-area"
              title="Click or drag image file here to set primary photo"
            >
              {imageObjectURL ? (
                <>
                  <img
                    src={imageObjectURL}
                    alt="Equipment preview"
                    className="absolute inset-0 w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center gap-1">
                    <span className="text-[10px] font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded text-cyan-600 uppercase tracking-wider">
                      Replace Image
                    </span>
                    <p className="text-[8px] text-slate-400 italic">Click or drag a new image file</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedImage();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer z-10"
                    title="Remove selected image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-2 pointer-events-none p-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-205 text-slate-400 group-hover:text-cyan-500 group-hover:border-cyan-500/30 transition-colors">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-650 block">Drag & Drop Image</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">or click to browse local files</span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-sans" id="upload-specs text-slate-400">
                    PNG, JPG, WEBP (Max 5MB)
                  </div>
                </div>
              )}
            </div>

            {/* Details footer */}
            {imageFile && (
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="truncate max-w-[130px]" title={imageFile.name}>{imageFile.name}</span>
                <span className="shrink-0 text-cyan-600 font-bold">{(imageFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit handle button */}
        <button
          type="submit"
          className="w-full bg-cyan-650 hover:bg-cyan-700 text-white font-bold py-3 text-xs rounded-lg transition duration-150 flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm mt-6 cursor-pointer"
          disabled={loading}
          id="product-form-submit-btn"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Register Catalog Item</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
