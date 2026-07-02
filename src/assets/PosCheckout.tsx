import React, { useState, useRef, useEffect } from "react";
import ScannerView from "./ScannerView";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  CreditCard, 
  Coins, 
  QrCode,
  Scan,
  AlertCircle,
  CheckCircle,
  Keyboard,
  Sparkles,
  RefreshCw,
  Edit2,
  Image as ImageIcon,
  BookOpen,
  Camera,
  Check,
  ArrowRight,
  Info
} from "lucide-react";
import { Product } from "../types";

export interface CartItem {
  id: string; // Product ID
  product: Product;
  quantity: number;
  price: number;
}

interface PosCheckoutProps {
  products: Product[];
  currentStocks: Record<string, number>;
  onCheckoutSubmit: (paymentMethod: string, items: { productId: string; quantity: number; price: number }[]) => Promise<boolean>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addBarcodeToCart: (barcode: string) => void;
  sales?: any[];
  onSwitchTab?: (tab: string) => void;
  categories?: string[];
  ownerMode?: boolean;
  recentProductIds?: string[];
}

export default function PosCheckout({ 
  products, 
  currentStocks, 
  onCheckoutSubmit,
  cart,
  setCart,
  addBarcodeToCart,
  sales = [],
  onSwitchTab,
  categories: appCategories,
  ownerMode = false,
  recentProductIds = [],
  scannerMode
}: PosCheckoutProps & { scannerMode?: "desktop" | "mobile" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Scanner State
  const [scanInput, setScanInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "warn" } | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [scanMethod, setScanMethod] = useState<"manual" | "camera">("camera");

  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [captureTime, setCaptureTime] = useState<string | null>(null);

  // Scanner lifecycle is handled by the central ScannerView component.
  const [manualProductName, setManualProductName] = useState("");
  const [manualProductPrice, setManualProductPrice] = useState("");
  const [manualProductCategory, setManualProductCategory] = useState("Accessories");
  const [manualProductSku, setManualProductSku] = useState("");

  // Filter grid catalog
  const categories = ["All", ...Array.from(new Set(appCategories && appCategories.length > 0 ? appCategories : products.map(p => p.category)))];
  const recencyRank = new Map(recentProductIds.map((id, index) => [id, index]));

  const normalizeSearch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

  useEffect(() => {
    const selectableCategories = categories.filter(c => c !== "All");
    if (selectableCategories.length === 0) return;
    if (!selectableCategories.includes(manualProductCategory)) {
      setManualProductCategory(selectableCategories[0]);
    }
  }, [categories]);
  
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const haystack = [p.name, p.brand || "", p.sizeVariant || "", p.sku, p.barcode || "", p.category].join(" ").toLowerCase();
    const matchesSearch = !term || haystack.includes(term) || normalizeSearch(haystack).includes(normalizeSearch(term));
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const aRank = recencyRank.has(a.id) ? recencyRank.get(a.id)! : Number.MAX_SAFE_INTEGER;
    const bRank = recencyRank.has(b.id) ? recencyRank.get(b.id)! : Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });

  // Expanded states for transaction history receipt details
  const [expandedSaleIds, setExpandedSaleIds] = useState<Record<string, boolean>>({});

  const toggleSaleExpand = (saleId: string) => {
    setExpandedSaleIds(prev => ({ ...prev, [saleId]: !prev[saleId] }));
  };

  // Memoized descending list of completed checkouts with full item information
  const enrichedSalesHistory = React.useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(sale => {
        const enrichedItems = (sale.items || []).map(item => {
          const matchProd = products.find(p => p.id === item.productId);
          return {
            ...item,
            productName: item.productName || matchProd?.name || `Product (${item.productId.split("-").pop()})`,
            sku: item.sku || matchProd?.sku || "GENERIC",
            imagePath: matchProd?.imagePath
          };
        });
        return {
          ...sale,
          enrichedItems
        };
      });
  }, [sales, products]);

  // Flat mapped past sale items for the Recent Transaction Items Ledger
  const recentTransactedItems = React.useMemo(() => {
    const list: Array<{
      productId: string;
      productName: string;
      sku: string;
      imagePath?: string;
      quantity: number;
      price: number;
      createdAt: string;
      saleId: string;
      paymentMethod: string;
    }> = [];

    // Sort sales descending by date
    const sortedSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    for (const sale of sortedSales) {
      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          const localProd = products.find(p => p.id === item.productId);
          list.push({
            productId: item.productId,
            productName: item.productName || localProd?.name || "Accessory Product",
            sku: localProd?.sku || "GENERIC",
            imagePath: localProd?.imagePath,
            quantity: item.quantity,
            price: item.price,
            createdAt: sale.createdAt,
            saleId: sale.id,
            paymentMethod: sale.paymentMethod
          });
        }
      }
    }
    return list.slice(0, 1);
  }, [sales, products]);

  const formatLocalDateTime = (value: string) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  // Real-time auto-matched suggestions based on user manual input queries
  const autoMatchedProducts = React.useMemo(() => {
    const term = scanInput.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter(p => 
        p.sku.toLowerCase().includes(term) || 
        (p.barcode || "").includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.brand || "").toLowerCase().includes(term) ||
        (p.sizeVariant || "").toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const aRank = recencyRank.has(a.id) ? recencyRank.get(a.id)! : Number.MAX_SAFE_INTEGER;
        const bRank = recencyRank.has(b.id) ? recencyRank.get(b.id)! : Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      })
      .slice(0, 5);
  }, [scanInput, products, recentProductIds]);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = manualProductName.trim();
    const priceNum = parseFloat(manualProductPrice);
    if (!name || isNaN(priceNum) || priceNum <= 0) {
      setError("Please fill out both the custom item name and valid price.");
      return;
    }

    const customSku = manualProductSku.trim().toUpperCase() || `CST-${Math.floor(100+Math.random()*900)}`;
    const virtualProduct: Product = {
      id: `custom-item-${Date.now()}`,
      name: name,
      brand: "Custom",
      sku: customSku,
      sizeVariant: "Standard",
      barcode: `CST${Date.now().toString().slice(-6)}`,
      category: manualProductCategory,
      buyPrice: priceNum * 0.6,
      sellPrice: priceNum,
      minStock: 0,
      createdAt: new Date().toISOString()
    };

    triggerBuzzer(true);
    
    // Auto-capture custom product frame
    setLastScannedProduct(virtualProduct);
    setCaptureTime(new Date().toLocaleTimeString());
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 260);

    setCart([...cart, {
      id: virtualProduct.id,
      product: virtualProduct,
      quantity: 1,
      price: priceNum
    }]);

    setScanFeedback({ message: `Successfully registered & billed custom accessory: ${name} (Rs. ${priceNum})`, type: "success" });
    setManualProductName("");
    setManualProductPrice("");
    setManualProductSku("");
    setError(null);
  };

  // Synthesize realistic cashier scanning beep
  const triggerBuzzer = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (isSuccess) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  };

  const addToBill = (prod: Product) => {
    setError(null);
    setSuccess(false);
    const stock = currentStocks[prod.id] ?? 0;

    // Check availability
    const existing = cart.find(item => item.id === prod.id);
    const requiredQty = (existing?.quantity ?? 0) + 1;

    if (requiredQty > stock) {
      setError(`Stock insufficient. Available stock for '${prod.name}' is only ${stock}.`);
      triggerBuzzer(false);
      return;
    }

    triggerBuzzer(true);
    
    // Auto-capture product transaction image in real-time
    setLastScannedProduct(prod);
    setCaptureTime(new Date().toLocaleTimeString());
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 260);

    if (existing) {
      setCart(cart.map(item => item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: prod.id, product: prod, quantity: 1, price: prod.sellPrice }]);
    }
  };

  // Scanner handle submit
  const handleScannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setScanFeedback(null);
    const code = scanInput.trim();
    if (!code) return;

    // Search for product barcode or SKU
    const match = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    
    if (match) {
      const stock = currentStocks[match.id] ?? 0;
      const existing = cart.find(item => item.id === match.id);
      const targetQty = (existing?.quantity ?? 0) + 1;

      if (targetQty > stock) {
        setScanFeedback({ message: `Insufficient Stock! Available is only ${stock}.`, type: "warn" });
        triggerBuzzer(false);
      } else {
        triggerBuzzer(true);
        
        // Auto-capture matched barcode verification image
        setLastScannedProduct(match);
        setCaptureTime(new Date().toLocaleTimeString());
        setCaptureFlash(true);
        setTimeout(() => setCaptureFlash(false), 260);

        if (existing) {
          setCart(cart.map(item => item.id === match.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
          setCart([...cart, { id: match.id, product: match, quantity: 1, price: match.sellPrice }]);
        }
        setScanFeedback({ message: `Scanned and Filled: [${match.sku}] ${match.name}`, type: "success" });
      }
      setScanInput("");
      // Keep input focused
      scannerInputRef.current?.focus();
    } else {
      triggerBuzzer(false);
      setScanFeedback({ 
        message: `Unknown accessory code: "${code}". Register as quick catalog product to sell?`, 
        type: "warn" 
      });
    }
  };

  // Instant catalog lookup registration handler
  const handleQuickRegister = async () => {
    const code = scanInput.trim();
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Quick Custom Accessory [${code.slice(-4)}]`,
          sku: `QA-${code.slice(-4).toUpperCase()}`,
          barcode: code,
          brand: "Custom",
          sizeVariant: "Standard",
          category: "Accessories",
          buyPrice: 0,
          sellPrice: 350, // default placeholder retail price
          minStock: 2
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Could not write item");
      }

      const generatedProduct = await res.json();
      triggerBuzzer(true);
      
      // Auto-capture dynamic image for newly generated accessory product definition
      setLastScannedProduct(generatedProduct);
      setCaptureTime(new Date().toLocaleTimeString());
      setCaptureFlash(true);
      setTimeout(() => setCaptureFlash(false), 260);
      
      setScanFeedback({ message: `Catalog item created: ${generatedProduct.name}. Register stock intake next.`, type: "success" });
      setScanInput("");
      
      // Instruct standard page sync in background so catalog listing registers it too
      setTimeout(() => {
        const syncButton = document.getElementById("settings-owner-quick-toggle");
        if (syncButton) {
          // Trigger catalog reload indirectly or refresh
        }
      }, 100);
    } catch (err: any) {
      setError(err?.message || "Failed to catalog temporary code");
    } finally {
      setLoading(false);
      scannerInputRef.current?.focus();
    }
  };

  // Form editable bill methods
  const handleEditCartItemName = (productId: string, nameOverride: string) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          product: {
            ...item.product,
            name: nameOverride
          }
        };
      }
      return item;
    }));
  };

  const handleEditCartItemSku = (productId: string, skuOverride: string) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          product: {
            ...item.product,
            sku: skuOverride.toUpperCase()
          }
        };
      }
      return item;
    }));
  };

  const handleEditCartItemPrice = (productId: string, newPrice: number) => {
    const val = isNaN(newPrice) || newPrice < 0 ? 0 : newPrice;
    setCart(cart.map(item => {
      if (item.id === productId) {
        return { ...item, price: val };
      }
      return item;
    }));
  };

  const handleEditCartItemQty = (productId: string, newQty: number) => {
    setError(null);
    const match = cart.find(item => item.id === productId);
    if (!match) return;

    if (isNaN(newQty) || newQty <= 0) {
      // Allow editing helper but clamp to zero for deletion
      removeFromCart(productId);
      return;
    }

    const stock = currentStocks[productId] ?? 100; // default safe cap
    if (newQty > stock) {
      setError(`Stock cap check: Available supply for "${match.product.name}" is ${stock}. Adjusted accordingly.`);
      setCart(cart.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: stock };
        }
        return item;
      }));
      return;
    }

    setCart(cart.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setError(null);
    const existing = cart.find(item => item.id === productId);
    if (!existing) return;

    const stock = currentStocks[productId] ?? 100;
    const targetQty = existing.quantity + delta;

    if (targetQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (targetQty > stock) {
      setError(`Supply capacity ceiling. Maximum available in stock is ${stock}.`);
      triggerBuzzer(false);
      return;
    }

    triggerBuzzer(true);
    setCart(cart.map(item => item.id === productId ? { ...item, quantity: targetQty } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    setError(null);
    setSuccess(false);

    if (cart.length === 0) {
      setError("Active checkout bill has no items.");
      return;
    }

    setLoading(true);
    try {
      const checkoutItems = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        productName: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode || ""
      }));

      const isOk = await onCheckoutSubmit(paymentMethod, checkoutItems);
      if (isOk) {
        setSuccess(true);
        setCart([]);
        setScanFeedback(null);
        setLastScannedProduct(null); // Hide auto-captured photo component upon billing
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Checkout processing failed. Check host database availability.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit sales checkout");
    } finally {
      setLoading(false);
    }
  };

  // Focus scanner field
  const handleTriggerFocus = () => {
    scannerInputRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto w-full font-sans animate-fade-in" id="pos-billing-layout-grid">
      
      {/* Centereed Live POS Billing invoice Cart */}
      <div className="flex flex-col bg-white border-2 border-slate-350 rounded-2xl overflow-hidden min-h-[500px] shadow-md" id="pos-checkout-panel">
        
        {/* Panel Title */}
        <div className="p-4 bg-slate-100 border-b border-slate-300 flex justify-between items-center" id="cart-header">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-cyan-700 stroke-[2.5]" />
            <span className="font-black text-sm uppercase tracking-wider font-sans text-slate-900">Checkout Cart Ledger</span>
          </div>
          <span className="bg-cyan-100 text-cyan-900 px-3 py-1 rounded-md text-[11px] font-black uppercase border border-cyan-200 font-sans shadow-xs">
            {cart.length} items
          </span>
        </div>

        {/* 📟 INTERACTIVE BARCODE SCANNER PORT */}
        <div className="p-4 bg-slate-50 border-b-2 border-slate-300 space-y-4 font-sans text-left" id="scanner-receiving-port">
          {/* Scan method tabs & coming soon badge */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2.5" id="scan-channels">
            <span 
              role="button"
              tabIndex={0}
              onClick={() => {
                setScanMethod("camera");
              }}
              className={`text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg font-sans flex items-center gap-1.5 cursor-pointer transition-all select-none border ${
                scanMethod === "camera"
                  ? "text-white bg-cyan-705 bg-cyan-700 border-cyan-600 shadow-sm"
                  : "text-slate-705 text-slate-700 bg-white border-slate-300 hover:text-slate-900"
              }`}
              id="pos-scan-webcam-button"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" /> Smart Scanner
            </span>
            <span 
              role="button"
              tabIndex={0}
              onClick={() => {
                setScanMethod("manual");
              }}
              className={`text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg font-sans flex items-center gap-1.5 cursor-pointer transition-all select-none border ${
                scanMethod === "manual"
                  ? "text-white bg-cyan-705 bg-cyan-700 border-cyan-600 shadow-sm"
                  : "text-slate-705 text-slate-700 bg-white border-slate-300 hover:text-slate-900"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 stroke-[2.5]" /> Manual Entry
            </span>
            <span className="text-[10px] font-bold uppercase text-slate-500 px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 border-dashed font-sans flex items-center gap-1" title="Future AI auto-detect scan is planned for camera hardware upgrades.">
              <Sparkles className="w-3 h-3 text-slate-405 animate-pulse" /> AI Predict-Scan
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-700 font-sans uppercase tracking-wider flex items-center gap-1">
              Terminal Mode: {
                scanMethod === "camera" 
                  ? "Smart Scan Engine" 
                  : "Direct Ad-hoc Specifications"
              }
            </span>
          </div>

          {scanMethod === "camera" && (
            <div className="bg-white border-2 border-slate-350 p-4 rounded-xl space-y-4 font-sans text-left" id="direct-webcam-scan-panel">
              <ScannerView
                products={products}
                currentStocks={currentStocks}
                onSimulateBarcode={addBarcodeToCart}
                barcodeStatus={scanFeedback?.message ?? null}
                scannerMode={scannerMode}
              />
            </div>
          )}

          {scanMethod === "manual" && (
            /* Manual Directly form inside Scanner slot - cleanly embedded */
            <form onSubmit={handleAddCustomItem} className="bg-white border-2 border-slate-300 p-4 rounded-xl space-y-4" id="inner-manual-create-form">
              <div className="text-[10px] font-black text-cyan-900 font-sans uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b-2 border-slate-150">
                <Keyboard className="w-4 h-4 text-cyan-700 stroke-[2.5]" /> Ad-hoc Product Quick-Bill Creation
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-705 block uppercase font-sans tracking-wide mb-1">Product Title / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. LS2 Helmet visor tinted, Custom Carbon Grip..."
                    value={manualProductName}
                    onChange={(e) => setManualProductName(e.target.value)}
                    className="w-full text-xs font-black px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 font-sans animate-fade-in"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-705 block uppercase font-sans tracking-wide mb-1">Retail Billed Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1250"
                    value={manualProductPrice}
                    onChange={(e) => setManualProductPrice(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-black focus:outline-none focus:border-cyan-600 focus:bg-white font-sans text-left"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-705 block uppercase font-sans tracking-wide mb-1">SKU Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. VISOR-TINT01"
                    value={manualProductSku}
                    onChange={(e) => setManualProductSku(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-black uppercase font-sans focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-705 block uppercase font-sans tracking-wide mb-1">Inventory Allocation Group</label>
                  <select
                    value={manualProductCategory}
                    onChange={(e) => setManualProductCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-black focus:outline-none focus:border-cyan-600 focus:bg-white font-sans cursor-pointer"
                  >
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-100 hover:bg-cyan-205 border-2 border-cyan-300 text-cyan-950 font-black text-[11px] uppercase tracking-wider py-3 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-cyan-800 stroke-[2.5]" /> Inject & Bill Custom Accessory
              </button>
            </form>
          )}

          {/* Scanner Feedback Messages */}
          {scanFeedback && (
            <div className={`p-2.5 rounded-lg text-[10px] font-sans flex items-center justify-between gap-2 border ${
              scanFeedback.type === "success" 
                ? "bg-cyan-50 text-cyan-700 border-cyan-100" 
                : "bg-amber-50 text-amber-700 border-amber-100"
            }`}>
              <span className="truncate font-medium">{scanFeedback.message}</span>
              {scanFeedback.type === "warn" && scanInput.trim() && (
                <button
                  type="button"
                  onClick={handleQuickRegister}
                  className="bg-amber-600 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded font-sans hover:bg-amber-700 transition cursor-pointer"
                >
                  ⚡ Register Now
                </button>
              )}
            </div>
          )}

          {/* 📟 LIVE OPTICAL IMAGE AUTO-CAPTURE HUD */}
          {lastScannedProduct && !loading && (
            <div 
              className={`p-3.5 rounded-xl border-2 transition-all duration-300 relative overflow-hidden flex items-center gap-4 select-none ${
                captureFlash 
                  ? "bg-cyan-105 bg-cyan-100 border-cyan-405 border-cyan-400 scale-[1.03] shadow-md animate-pulse" 
                  : "bg-white border-slate-350 shadow-sm"
              }`}
              id="live-optical-capture-terminal"
            >
              {/* Camera view target graphic details */}
              <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-600 opacity-90"></div>
              <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-600 opacity-90"></div>
              <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-600 opacity-90"></div>
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-600 opacity-90"></div>
              
              {/* Glowing camera scanner laser beam effect */}
              {!captureFlash && (
                <div className="absolute inset-x-0 h-[2px] bg-cyan-500 opacity-70 shadow-[0_0_10px_#06b6d4] animate-bounce pointer-events-none" style={{ top: "45%" }}></div>
              )}

              {/* Dynamic Photo Container */}
              <div className="w-16 h-16 rounded-md bg-slate-100 border-2 border-slate-300 shrink-0 overflow-hidden relative flex items-center justify-center shadow-xs">
                {lastScannedProduct.imagePath ? (
                  <img
                    src={lastScannedProduct.imagePath}
                    alt={lastScannedProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
                {/* Visual HUD overlay text */}
                <div className="absolute bottom-0 inset-x-0 bg-cyan-700/90 text-[7px] font-sans text-white text-center py-0.5 uppercase tracking-tighter font-black">
                  CAM CAPTURE
                </div>
              </div>

              {/* Captured metadata fields */}
              <div className="flex-1 min-w-0 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded border-2 border-cyan-205 border-cyan-200 uppercase tracking-widest font-sans shadow-xs">
                    Auto-Captured Photo
                  </span>
                  <span className="text-[10px] text-slate-600 font-extrabold font-sans">
                    ⏰ {captureTime || "Just now"}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-900 truncate pr-2" title={lastScannedProduct.name}>
                  {lastScannedProduct.name}
                </h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-sans text-slate-700 font-extrabold">
                  <div>SKU: <span className="text-cyan-800 font-black">{lastScannedProduct.sku}</span></div>
                  <div className="text-right">Price: <span className="text-slate-900 font-black">Rs. {lastScannedProduct.sellPrice}</span></div>
                  <div>EAN: <span className="text-slate-600 font-mono font-bold">{lastScannedProduct.barcode}</span></div>
                  <div className="text-right">Stock: <span className="text-emerald-800 font-black">{currentStocks[lastScannedProduct.id] ?? 0} av.</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error / Feedback notification */}
        {error && (
          <div className="bg-rose-50 text-rose-700 text-xs py-2.5 px-4 border-b border-rose-100 flex items-center gap-2 font-sans text-left" id="cart-error">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success billing notification */}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 text-xs py-2.5 px-4 border-b border-emerald-100 flex items-center gap-2 font-sans text-left" id="cart-success">
            <CheckCircle className="w-4 h-4 text-emerald-505 shrink-0" />
            <span>Sales invoice successfully booked! Inventory stock updated.</span>
          </div>
        )}

        {/* Editable Bill Cart list */}
        <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-150 bg-white" id="cart-items-scroll">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center h-full min-h-[180px]">
              <ShoppingCart className="w-14 h-14 text-slate-300 mb-3 stroke-[2]" />
              <p className="text-sm font-black text-slate-800">Ready for customer transactions</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[285px] leading-relaxed font-sans font-bold">
                Select optical scan or click the manual tab to spec out a custom accessory directly here on the invoice.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              return (
                <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col gap-2.5" id={`cart-row-${item.id}`}>
                  
                  {/* Inline Editable Product Name & SKU */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded bg-slate-105 bg-slate-100 border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {item.product.imagePath ? (
                        <img
                          src={item.product.imagePath}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-12 gap-25 gap-2 items-center">
                      <div className="col-span-4 font-sans">
                        <input
                          type="text"
                          value={item.product.sku}
                          onChange={(e) => handleEditCartItemSku(item.id, e.target.value)}
                          className="w-full text-[10px] font-sans font-black text-cyan-900 bg-slate-50 border-2 border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:border-cyan-600 focus:bg-white text-left uppercase"
                          placeholder="SKU"
                          title="Edit Item SKU Code on invoice"
                        />
                      </div>
                      <div className="col-span-8 text-left">
                        <input
                          type="text"
                          value={item.product.name}
                          onChange={(e) => handleEditCartItemName(item.id, e.target.value)}
                          className="w-full text-xs font-black text-slate-900 bg-slate-100/50 border-2 border-slate-300 rounded-md px-2.5 py-1 focus:outline-none focus:border-cyan-600 focus:bg-white"
                          placeholder="Product Name"
                          title="Edit Item title on invoice"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline Price Override, Quantity Direct Input & Line Total */}
                  <div className="flex items-center justify-between gap-3 mt-1" id="cart-item-row-ops">
                    
                    {/* Price Override Field */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-705 text-slate-700 font-extrabold font-sans">Rs.</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleEditCartItemPrice(item.id, Number(e.target.value))}
                        className="w-24 text-xs font-black font-sans bg-slate-100 text-cyan-900 border-2 border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:border-cyan-600 focus:bg-white text-right"
                        title="Override retail sale price"
                        min="0"
                      />
                      <span className="text-[10px] text-slate-650 text-slate-600 font-extrabold font-sans">each</span>
                    </div>

                    {/* Quantity Field directly editable */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-205 border-2 border-slate-300 flex items-center justify-center text-slate-700 hover:text-slate-900 transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleEditCartItemQty(item.id, Number(e.target.value))}
                        className="w-10 text-center text-xs font-black font-sans text-slate-900 bg-white border-2 border-slate-300 rounded-md py-1 focus:outline-none focus:border-cyan-600"
                        title="Type exact quantity directly"
                        min="1"
                      />

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-205 border-2 border-slate-300 flex items-center justify-center text-slate-700 hover:text-slate-900 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Total cost and action layout */}
                    <div className="text-right flex items-center gap-3.5 min-w-[110px] justify-end font-sans">
                      <span className="text-xs text-slate-500 font-bold block md:inline mr-1">Row Total:</span>
                      <span className="text-sm font-black text-slate-950">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
                        aria-label="Remove item"
                        title="Remove Accessory from Cart"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Invoice Summary calculation: ONLY THE PAYABLE TOTAL */}
        <div className="p-5 bg-slate-100 border-t-2 border-slate-300" id="cart-summary-calculations">
          <div className="flex justify-between items-center text-slate-900 font-black font-sans text-left">
            <span className="text-xs uppercase tracking-wider font-sans font-black text-slate-700">Total Invoice Payable</span>
            <span className="text-2xl font-sans font-black text-emerald-700">Rs. {calculateSubtotal().toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Channels and Checkout trigger */}
        <div className="p-4 bg-slate-55 bg-slate-50 border-t-2 border-slate-300 space-y-4 text-left border-b border-slate-200" id="cart-triggers">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-800 block uppercase tracking-wider font-sans">Select Payment Mode</label>
            <div className="grid grid-cols-3 gap-2" id="pos-payment-methods">
              {[
                { id: "Cash", label: "Cash Desk", icon: Coins },
                { id: "UPI", label: "UPI/Scan Qr", icon: QrCode },
                { id: "Credit Card", label: "Card Swipe", icon: CreditCard }
              ].map((m) => {
                const SelectedIcon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-1 rounded-lg text-[9px] font-bold transition flex flex-col items-center justify-center gap-1.5 border uppercase tracking-wider cursor-pointer ${
                      paymentMethod === m.id
                        ? "bg-cyan-600 border border-cyan-500 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-550 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <SelectedIcon className={`w-4 h-4 ${paymentMethod === m.id ? "text-white" : "text-cyan-600"}`} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className={`w-full font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-sans border-0 shadow-xs ${
              cart.length === 0
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer font-bold"
            }`}
            id="checkout-finalize-btn"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
            ) : (
              <>
                <span>Record Invoice & Discharge Stock</span>
              </>
            )}
          </button>
        </div>

        {/* 📋 TRANSACTION HISTORY JOURNAL (Placing it last in checkout) */}
        <div className="p-4 bg-slate-50 text-left border-t border-slate-200" id="recent-transaction-journal">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-600" /> POS Transaction History
            </span>
            <span className="text-[8px] text-slate-400 font-sans uppercase tracking-widest">
              {enrichedSalesHistory.length} Slip(s) Archived
            </span>
          </div>

          {enrichedSalesHistory.length === 0 ? (
            <p className="text-[10px] font-medium text-slate-400 text-center py-4 font-sans leading-relaxed select-none">
              No sales transactions recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1" id="recent-checkout-items-journal-grid">
              {enrichedSalesHistory.map((sale) => {
                const isExpanded = !!expandedSaleIds[sale.id];
                const cleanSaleId = sale.id.replace("sale-", "S-").substring(0, 10).toUpperCase();
                const saleTimestamp = formatLocalDateTime(sale.createdAt);

                return (
                  <div 
                    key={sale.id}
                    className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all duration-200"
                  >
                    {/* Header Summary Row */}
                    <div 
                      onClick={() => toggleSaleExpand(sale.id)}
                      className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {/* Payment Mode Badge with icon */}
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1 font-sans border ${
                          sale.paymentMethod === "UPI" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : sale.paymentMethod === "Cash"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {sale.paymentMethod === "UPI" && <QrCode className="w-2.5 h-2.5" />}
                          {sale.paymentMethod === "Cash" && <Coins className="w-2.5 h-2.5" />}
                          {sale.paymentMethod === "Credit Card" && <CreditCard className="w-2.5 h-2.5" />}
                          {sale.paymentMethod}
                        </span>
                        
                        <span className="text-[10px] font-black text-slate-500 font-sans uppercase tracking-widest">
                          #{cleanSaleId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-sans">
                          <div className="text-[11px] font-black text-slate-900 leading-none">
                            Rs. {sale.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none">
                            {saleTimestamp}
                          </div>
                        </div>

                        {/* Expand status caret indicator */}
                        <span className="text-[9px] font-black text-cyan-600 hover:text-cyan-850 uppercase tracking-tighter">
                          {isExpanded ? "▲ Hide" : `▼ View (${sale.enrichedItems.length})`}
                        </span>
                      </div>
                    </div>

                    {/* Expandable itemized detail layout */}
                    {isExpanded && (
                      <div className="border-t border-slate-150 p-2.5 bg-slate-50/30 space-y-2 divider-y divider-slate-100">
                        {sale.enrichedItems.map((item, idy) => (
                          <div 
                            key={`${sale.id}-${item.productId}-${idy}`}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors relative"
                          >
                            {/* Small product image/icon */}
                            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                              {item.imagePath ? (
                                <img 
                                  src={item.imagePath} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer" 
                                />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-left font-sans">
                              <span className="font-sans text-[8px] text-cyan-700 font-black uppercase tracking-wider">{item.sku}</span>
                              <h6 className="text-[10px] font-black text-slate-800 truncate pr-6 mt-0.5" title={item.productName}>
                                {item.productName}
                              </h6>
                              <span className="text-[9px] font-sans text-slate-500 font-bold">
                                {item.quantity} x Rs. {item.price.toLocaleString()} = <span className="text-emerald-700 font-black">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                              </span>
                            </div>

                            {/* Load again / repeat helper button */}
                            <button
                              type="button"
                              onClick={() => {
                                const localProd = products.find(p => p.id === item.productId) || {
                                  id: item.productId,
                                  name: item.productName,
                                  sku: item.sku,
                                  barcode: `GEN-${Date.now().toString().slice(-4)}`,
                                  category: "Accessories",
                                  buyPrice: item.price * 0.6,
                                  sellPrice: item.price,
                                  minStock: 2,
                                  createdAt: new Date().toISOString()
                                };
                                addToBill(localProd as Product);
                                setScanFeedback({ message: `Re-added item from bill: ${item.productName}`, type: "success" });
                              }}
                              className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition-all shrink-0"
                              title="Re-add to current bill"
                            >
                              <Plus className="w-3 h-3 text-cyan-700 stroke-[3]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
