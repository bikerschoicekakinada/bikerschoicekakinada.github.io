import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Package, 
  Activity, 
  ShoppingCart, 
  Coins, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  Database, 
  RefreshCw,
  Sliders,
  Sparkles,
  Info
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardCard from "./components/DashboardCard";
import ProductForm from "./components/ProductForm";
import ProductTable from "./components/ProductTable";
import InventoryEventForm from "./components/InventoryEventForm";
import InventoryTable from "./components/InventoryTable";
import PosCheckout, { CartItem } from "./components/PosCheckout";
import CategoryManager from "./components/CategoryManager";
import AnalyticsHub from "./components/AnalyticsHub";
import ScannerView from "./components/ScannerView";
import InventoryView from "./components/InventoryView";

import { 
  Product, 
  InventoryEvent, 
  Sale, 
  ProductPerformance, 
  InventoryStats,
  BrandConfig
} from "./types";

import BrandProfileModal from "./components/BrandProfileModal";


export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [scannerMode, setScannerMode] = useState<"desktop" | "mobile">("desktop");

  const [ownerMode, setOwnerMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("bikers_choice_owner_mode");
    return saved === "true";
  });

  const handleSetOwnerMode = (mode: boolean) => {
    setOwnerMode(mode);
    localStorage.setItem("bikers_choice_owner_mode", String(mode));
  };

  const detectMobileScanner = () => {
    if (typeof window === "undefined") return false;
    const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const isMobileUaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile === true;
    return isMobileUa || isMobileUaData;
  };

  const handleOpenScanner = () => {
    const mobile = detectMobileScanner();
    setScannerMode(mobile ? "mobile" : "desktop");
    setActiveTab("scanner");
  };

  const [brandConfig, setBrandConfig] = useState<BrandConfig>(() => {
    const saved = localStorage.getItem("bikers_choice_brand_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default state
      }
    }
    return {
      type: "image",
      // Use the repository-provided logo served under the /branding path
      imageUrl: "/branding/bikers-choice-logo.png",
      initials: "BC",
      color: "#06b6d4",
      name: "BIKER'S CHOICE",
      subtext: "KAKINADA"
    };
  });

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const handleSaveBrandConfig = (newConfig: BrandConfig) => {
    setBrandConfig(newConfig);
    localStorage.setItem("bikers_choice_brand_config", JSON.stringify(newConfig));
    setIsBrandModalOpen(false);
  };

  // Enforce permanent logo image path (overwrite any uploaded image)
  React.useEffect(() => {
    const enforcedUrl = "/branding/bikers-choice-logo.png";
    if (brandConfig.imageUrl !== enforcedUrl || brandConfig.type !== "image") {
      const updated = { ...brandConfig, imageUrl: enforcedUrl, type: "image" };
      setBrandConfig(updated);
      try { localStorage.setItem("bikers_choice_brand_config", JSON.stringify(updated)); } catch (e) {}
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Categories Administration States and Handlers
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("bikers_choice_categories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to load categories, using defaults", e);
      }
    }
    return ["Helmets", "Riding Gear", "Modifications", "Accessories", "Custom Products"];
  });

  const handleAddCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Category "${trimmed}" already exists.`);
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    localStorage.setItem("bikers_choice_categories", JSON.stringify(updated));
  };

  const handleModifyCategory = async (oldName: string, newName: string | null) => {
    setActionLoading(true);
    try {
      const targetCategory = newName || "Accessories";
      
      // Update matching products on standard storage server
      const res = await fetch("/api/products/bulk-update-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldCategory: oldName, newCategory: targetCategory })
      });
      
      if (!res.ok) {
        throw new Error("Failed to align store products database for changed category");
      }

      let updatedList: string[];
      if (newName === null) {
        // Deleting category
        updatedList = categories.filter(c => c !== oldName);
        if (!updatedList.includes("Accessories")) {
          updatedList.push("Accessories");
        }
      } else {
        // Renaming category
        updatedList = categories.map(c => c === oldName ? newName : c);
      }

      const uniq = Array.from(new Set(updatedList));
      setCategories(uniq);
      localStorage.setItem("bikers_choice_categories", JSON.stringify(uniq));

      // Force database sync to update UI catalogs
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error modifying category list");
    } finally {
      setActionLoading(false);
    }
  };

  
  // App state
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);

  // Modal / Interaction states
  const [selectedProductForEvent, setSelectedProductForEvent] = useState<Product | null>(null);
  const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);
  const flushUiPaint = () => {
    requestAnimationFrame(() => {
      void document.body.offsetHeight;
    });
  };

  const handleQuickRegisterProduct = async (formData: {
    name: string;
    brand: string;
    sku: string;
    sizeVariant: string;
    barcode: string;
    category: string;
    sellPrice: number;
    minStock: number;
  }) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errJson = await res.json();
        alert(errJson.error || "Failed to create product");
        return;
      }
      
      // Refresh the products list, stack stats counts
      await fetchData();
        flushUiPaint();
      setBarcodeStatus(`✔ Registered catalog item [${formData.sku}] — register stock intake next.`);
      setTimeout(() => setBarcodeStatus(null), 4500);

      // Close modal
      setUnregisteredBarcode(null);
    } catch (e: any) {
      alert("Error registering stock item: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch all core business data from backend
  const fetchData = async () => {
    try {
      const prodRes = await fetch("/api/products");
      const prodText = await prodRes.text();
      if (prodText.includes("Cookie check") || prodText.includes("<!doctype")) {
        setSyncError("cookie_check");
        return;
      }
      const prodData = JSON.parse(prodText);

      const evtRes = await fetch("/api/inventory-events");
      const evtText = await evtRes.text();
      if (evtText.includes("Cookie check") || evtText.includes("<!doctype")) {
        setSyncError("cookie_check");
        return;
      }
      const evtData = JSON.parse(evtText);

      const salesRes = await fetch("/api/sales");
      const salesText = await salesRes.text();
      if (salesText.includes("Cookie check") || salesText.includes("<!doctype")) {
        setSyncError("cookie_check");
        return;
      }
      const salesData = JSON.parse(salesText);

      const statsRes = await fetch("/api/intelligence/stats");
      const statsText = await statsRes.text();
      if (statsText.includes("Cookie check") || statsText.includes("<!doctype")) {
        setSyncError("cookie_check");
        return;
      }
      const statsData = JSON.parse(statsText);

      setProducts(prodData);
      setEvents(evtData);
      setSales(salesData);
      setStats(statsData);
      setSyncError(null);
        flushUiPaint();
    } catch (err: any) {
      console.error("Failed to synchronise data with host node:", err);
      if (err?.message?.includes("Unexpected token '<'") || err?.message?.includes("not valid JSON")) {
        setSyncError("cookie_check");
      } else {
        setSyncError(err?.message || String(err));
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Periodic slow polling for local LAN real-time synchronization
  useEffect(() => {
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Action: Create a product
  const handleProductCreate = async (data: any) => {
    try {
      const isFormData = data instanceof FormData;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body: isFormData ? data : JSON.stringify(data)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create product");
      }
      await fetchData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Action: Record stock movement manually
  const handleRecordEvent = async (data: any) => {
    try {
      const res = await fetch("/api/inventory-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error("Failed to post event");
      }
      await fetchData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Action: Process checkout sale (reduction is automated at backend)
  const handlePOSCheckoutSubmit = async (paymentMethod: string, items: any[]) => {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, items })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to process transaction");
      }
      await fetchData();
      return true;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Action: Server-Side AI Predictive demand analysis trigger
  const handleTriggerAiAnalysis = async () => {
    const res = await fetch("/api/ai-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      throw new Error("API analysis failed");
    }
    return await res.json();
  };

  // System Re-seeding handler
  const handleSystemReSeed = async () => {
    setActionLoading(true);
    try {
      // Confirm destructive action with the user
      const doWipe = window.confirm("This will PERMANENTLY wipe all data and cannot be undone.\n\nSelect OK to wipe database completely (remove all products, inventory and sales). Select Cancel to re-seed demo defaults.");

      const body = doWipe ? { mode: "wipe" } : { mode: "seed" };

      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        // Wait briefly for server to finalize file write before re-fetching
        await new Promise(resolve => setTimeout(resolve, 800));

        // Fetch fresh data with cache busting
        const prodRes = await fetch("/api/products?_t=" + Date.now());
        const prodData = await prodRes.json();
        const evtRes = await fetch("/api/inventory-events?_t=" + Date.now());
        const evtData = await evtRes.json();
        const salesRes = await fetch("/api/sales?_t=" + Date.now());
        const salesData = await salesRes.json();
        const statsRes = await fetch("/api/intelligence/stats?_t=" + Date.now());
        const statsData = await statsRes.json();

        // Update state with fresh data
        setProducts(prodData);
        setEvents(evtData);
        setSales(salesData);
        setStats(statsData);
        setCart([]);

        // Force a slight delay before alert to ensure re-render
        await new Promise(resolve => setTimeout(resolve, 200));
        alert(doWipe ? "Database wiped to empty state." : "Database re-seeded to demo defaults.");
      } else {
        alert("Failed to reset database on server.");
      }
    } catch (err) {
      console.error(err);
      alert("Error resetting database: " + err);
    } finally {
      setActionLoading(false);
    }
  };

  // Barcode quick entry trigger (simulated-hardware barcode scanning flow)
  const handleSimulateBarcode = (scannedCode: string) => {
    // Attempt to locate a product with matching Barcode numerical ID
    const match = products.find(p => p.barcode === scannedCode || p.sku === scannedCode);
    if (match) {
      setBarcodeStatus(`✔ [${match.sku}] Scanned Successfully!`);
      setTimeout(() => setBarcodeStatus(null), 3000);

      // If sales tab is active, automatically push to checkout cart
      if (activeTab === "sales") {
        const currentStockVal = stats?.currentStocks[match.id] ?? 0;
        const inCart = cart.find(i => i.id === match.id);
        const nextQty = (inCart?.quantity ?? 0) + 1;

        if (nextQty <= currentStockVal) {
          setCart(prev => {
            const exists = prev.find(i => i.id === match.id);
            if (exists) {
              return prev.map(i => i.id === match.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: match.id, product: match, quantity: 1, price: match.sellPrice }];
          });
        } else {
          setBarcodeStatus(`⚠️ Out of Stock / Cap Met: (${currentStockVal})`);
        }
      } else {
        // Switch to sales tab and add automatically for optimal workflow!
        setActiveTab("sales");
        setCart(prev => {
          const exists = prev.find(i => i.id === match.id);
          if (exists) {
            return prev.map(i => i.id === match.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { id: match.id, product: match, quantity: 1, price: match.sellPrice }];
        });
      }
    } else {
      setBarcodeStatus(`❌ Barcode: "${scannedCode}" - Unregistered accessory! Please register in stock.`);
      setUnregisteredBarcode(scannedCode);
      setTimeout(() => setBarcodeStatus(null), 4000);
    }
  };

  // Dynamic values extracted safely from stats payload
  const currentStocks: Record<string, number> = (stats?.currentStocks || {}) as Record<string, number>;
  const productPerformanceList = stats?.productPerformance || [];
  const lowStockPList = productPerformanceList.filter(p => p.isLowStock);
  const recentProductIds = stats?.recentProductIds || [];
  const totalInventoryCount: number = Object.values(currentStocks).reduce((sum: number, currentVal: number) => sum + currentVal, 0);

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans selection:bg-cyan-500/20 selection:text-slate-900" id="biker-choice-erp-root">
      
      {/* Sidebar - consistent Dark Brand bar on the left */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lowStockCount={lowStockPList.length} 
        ownerMode={ownerMode}
        onSetOwnerMode={handleSetOwnerMode}
        brandConfig={brandConfig}
        onEditLogoClick={() => setIsBrandModalOpen(true)}
      />

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50" id="main-content-window">
        {/* Header - top navigation items */}
        <Header 
          activeTab={activeTab} 
          onSimulateBarcode={handleSimulateBarcode} 
          barcodeStatus={barcodeStatus} 
          lowStockCount={lowStockPList.length}
          brandConfig={brandConfig}
          onEditLogoClick={() => setIsBrandModalOpen(true)}
          onSwitchTab={setActiveTab}
          onOpenScanner={handleOpenScanner}
        />

        {/* Dynamic page container based on the active state */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50/50" id="applet-viewport-main">
          
          {/* Diagnostic Sync/Cookie Warning Banner */}
          {syncError && (
            <div className="mb-6 p-5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all" id="sync-error-warning-banner">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  {syncError === "cookie_check" ? "🔒 Browser Cookie Restriction / Sandbox Active" : "⚠️ Local Database Synchronisation Warning"}
                </h4>
                <p className="text-[11px] text-neutral-350 font-medium mt-1 leading-relaxed">
                  {syncError === "cookie_check" ? (
                    <>
                      Your browser's privacy sandbox or iframe third-party cookie policy is restricting dynamic API requests. 
                      To instantly sync and unlock the fully functional live database, click <strong>'Open in a New Tab'</strong> or <strong>'Open in standard window'</strong> in the top-right workspace toolbar, or enable third-party cookies.
                    </>
                  ) : (
                    <>The application was unable to query backend endpoints: {syncError}. Verify that the Express server container is running.</>
                  )}
                </p>
              </div>
              <a 
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-lg shadow-md transition-all text-center border border-red-500/20"
              >
                Run Standalone ERP
              </a>
            </div>
          )}
          
          {/* TAB: DASHBOARD VIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6" id="view-dashboard">
              
              {/* Row 1: KPI Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-grid">
                <DashboardCard 
                  title="Total Unique Products" 
                  value={products.length} 
                  subtext="Registered categories in catalogue" 
                  icon={Package}
                  colorClass="border-blue-600"
                />
                <DashboardCard 
                  title="Active Stock Volume" 
                  value={totalInventoryCount} 
                  subtext="Items physically in warehouse" 
                  icon={Layers}
                  colorClass="border-teal-500"
                />
                <DashboardCard 
                  title="Low Stock Alerts" 
                  value={lowStockPList.length} 
                  subtext={`Requires manual dispatch action`} 
                  trend={lowStockPList.length > 0 ? `${lowStockPList.length} items critical` : "Safe Levels"}
                  trendColor={lowStockPList.length > 0 ? "red" : "green"}
                  icon={AlertTriangle}
                  colorClass={lowStockPList.length > 0 ? "border-amber-500" : "border-slate-200"}
                />
                <DashboardCard 
                  title="Total Rotation Amount" 
                  value={ownerMode ? `Rs. ${(stats?.totalInventoryValue ?? 0).toLocaleString()}` : "🔒 Masked"} 
                  subtext={ownerMode ? "Total stock value at retail selling price" : "Restricted to Store Owner Mode"} 
                  icon={Coins}
                  colorClass="border-emerald-600"
                />
              </div>

              {/* Alert notification if low stock is active */}
              {lowStockPList.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-xs" id="dashboard-low-stock-alert-panel">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <p className="font-bold text-neutral-200">Operational Stock Leakage Alert: {lowStockPList.length} Products require replenishment!</p>
                    <div className="mt-1 flex flex-wrap gap-1.5" id="critical-items-chips">
                      {lowStockPList.map(p => (
                        <span key={p.id} className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold font-mono text-[10px]">
                          {p.sku} (Stock: {p.currentStock})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 2: Recent transactions splits (stacked vertically) */}
              <div className="flex flex-col gap-6" id="dashboard-history-split">
                
                {/* Panel left: Last 5 Retail Sales payments */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 flex flex-col shadow-sm" id="dashboard-recent-sales">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-1.5 font-sans">
                    <ShoppingCart className="w-4 h-4 text-red-500" />
                    Recent Point-of-Sale Checkout Logs
                  </h3>
                  
                  <div className="flex-1 overflow-x-auto mt-4" id="recent-sales-table-scroller">
                    <table className="w-full text-left" id="dashboard-sales-mini-table">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 font-sans">
                          <th className="py-2">Receipt ID</th>
                          <th className="py-2">Amount (Rs)</th>
                          <th className="py-2">Payment Channel</th>
                          <th className="py-2 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 text-xs">
                        {sales.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">No sales recorded yet.</td>
                          </tr>
                        ) : (
                          [...sales].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 font-mono text-cyan-600 font-bold">{sale.id}</td>
                              <td className="py-2.5 font-semibold text-slate-800">
                                {`Rs. ${sale.totalAmount.toLocaleString()}`}
                              </td>
                              <td className="py-2.5">
                                <span className="inline-block bg-slate-50 border border-slate-200/60 text-slate-600 rounded text-[9px] px-1.5 py-0.5 uppercase font-bold">
                                  {sale.paymentMethod}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-mono text-[10px] text-slate-500">
                                {new Intl.DateTimeFormat(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }).format(new Date(sale.createdAt))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel right: Last 5 Manual stock movement inventory ledger entries */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 flex flex-col shadow-sm" id="dashboard-recent-movements">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-1.5 font-sans">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Recent Inventory Ledger Movements
                  </h3>

                  <div className="flex-1 overflow-x-auto mt-4" id="recent-events-table-scroller">
                    <table className="w-full text-left" id="dashboard-events-mini-table">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 font-sans">
                          <th className="py-2">Product</th>
                          <th className="py-2 text-center">Type</th>
                          <th className="py-2 text-center">Qty</th>
                          <th className="py-2 text-right">Memo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 text-xs">
                        {events.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400">0 movements filed on ledger.</td>
                          </tr>
                        ) : (
                          [...events].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(evt => {
                            const p = products.find(prod => prod.id === evt.productId);
                            const plus = evt.type === "PURCHASE" || evt.type === "RETURN";
                            return (
                              <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5">
                                  <span className="font-mono text-[10px] font-bold text-slate-400 block">{p?.sku}</span>
                                  <span className="font-semibold text-slate-700 line-clamp-1">{p?.name || evt.productId}</span>
                                </td>
                                <td className="py-2.5 text-center">
                                  <span className="inline-block text-[10px] uppercase font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-205/40">{evt.type}</span>
                                </td>
                                <td className="py-2.5 text-center font-mono font-bold">
                                  <span className={plus ? "text-cyan-600" : "text-rose-600"}>
                                    {plus ? "+" : "-"}{evt.quantity}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-medium text-slate-500 max-w-[120px] truncate" title={evt.reason}>
                                  {evt.reason}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: PRODUCT REGISTER & RECORDS */}
          {activeTab === "products" && (
            <div className="flex flex-col gap-6" id="view-products">
              {/* Product form stacked on top */}
              <div className="w-full" id="product-form-layout-col">
                <ProductForm onSubmit={handleProductCreate} categories={categories} />
              </div>

              {/* Product table stacked below */}
              <div className="w-full" id="product-records-layout-col">
                <ProductTable 
                  products={products} 
                  currentStocks={currentStocks} 
                  onTriggerEventClick={(p) => setSelectedProductForEvent(p)} 
                  recentProductIds={recentProductIds}
                />
              </div>
            </div>
          )}

          {/* TAB: CURRENT LIVE INVENTORY LEVELS */}
          {activeTab === "inventory" && (
            <div id="view-inventory">
              <InventoryView 
                products={products} 
                currentStocks={currentStocks} 
                onTriggerEventClick={(p) => setSelectedProductForEvent(p)} 
              />
            </div>
          )}

          {/* TAB: STOCK MOVEMENT HISTORICAL LEDGER */}
          {activeTab === "movement" && (
            <div className="space-y-6" id="view-movement">
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs" id="inventory-instructions-header">
                <div className="flex gap-3 items-start select-none">
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg border border-cyan-100/60">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Interactive Stock Auditing Guidelines</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                      Biker's Choice uses event-based dynamic stock counting. Direct manual overrides to inventory are prohibited.
                      To correct discrepancies or document vendor deliveries, click <b>"Manual Audit Adjust"</b> next to any item in the <b>Live Quantities</b> tab.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg self-start sm:self-center uppercase transition tracking-wider shadow-sm border border-cyan-555 cursor-pointer"
                >
                  Go to Live Quantities
                </button>
              </div>

              {/* Major audit logs list */}
              <InventoryTable events={events} products={products} />
            </div>
          )}

          {/* TAB: POINT OF SALE CHECKOUT */}
          {activeTab === "sales" && (
            <div id="view-sales">
              <PosCheckout 
                products={products} 
                currentStocks={currentStocks} 
                onCheckoutSubmit={handlePOSCheckoutSubmit}
                cart={cart}
                setCart={setCart}
                addBarcodeToCart={handleSimulateBarcode}
                sales={sales}
                onSwitchTab={(tab) => setActiveTab(tab)}
                scannerMode={scannerMode}
                categories={categories}
                ownerMode={ownerMode}
                recentProductIds={recentProductIds}
              />
            </div>
          )}

          {/* TAB: WI-FI MOBILE SCANNING NODE */}
          {activeTab === "scanner" && (
            <div id="view-scanner">
              <ScannerView 
                products={products} 
                currentStocks={currentStocks} 
                onSimulateBarcode={handleSimulateBarcode} 
                barcodeStatus={barcodeStatus} 
                scannerMode={scannerMode}
              />
            </div>
          )}

          {/* TAB: PREDICTIVE INTEL & SECURED FINANCIAL REPORTS */}
          {activeTab === "reports" && (
            <div id="view-reports">
              <AnalyticsHub 
                performanceData={productPerformanceList}
                triggerAiAnalysis={handleTriggerAiAnalysis}
                ownerMode={ownerMode}
                onSetOwnerMode={handleSetOwnerMode}
              />
            </div>
          )}

          {/* TAB: SYSTEM CONFIGURATION & DB SEED CONTROLS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6" id="view-settings">
              <div className="bg-white rounded-xl border border-slate-205 p-6 shadow-xs" id="settings-card">
                <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100" id="settings-heading">
                  <Sliders className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Settings</h3>
                </div>

                <div className="space-y-4 text-xs" id="settings-controls-details">
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-1.5">
                    <span className="font-bold text-slate-700 block uppercase font-sans tracking-wide">Store Data Storage</span>
                    <p className="text-slate-500 leading-relaxed font-sans">
                      All your products, stock levels, and sales history are saved locally on this machine so they are always safe and available offline.
                    </p>
                  </div>

                  {/* Owner Credentials Helper Widget */}
                  <div className="bg-amber-500/5 p-4 border border-amber-500/20 rounded-lg space-y-2">
                    <span className="font-bold text-amber-700 block uppercase font-sans tracking-wide">Owner Access Mode</span>
                    <p className="text-slate-600 leading-relaxed font-sans mt-1">
                      By default, advanced cash rotation reports and AI-powered demand planning analytics are restricted to protect store operations. Unlock this with the owner passcode:
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <button
                        onClick={() => handleSetOwnerMode(!ownerMode)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                          ownerMode 
                            ? "bg-amber-500 text-white border-amber-400 shadow-sm"
                            : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                        }`}
                        id="settings-owner-quick-toggle"
                      >
                        {ownerMode ? "🔓 Owner: Unlocked" : "🔒 Staff Mode"}
                      </button>
                      <span className="text-[10px] text-amber-700 font-mono font-bold uppercase bg-amber-50 border border-amber-100 px-2 py-1 rounded">
                        Passcode: 1234
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 text-slate-700 p-4 rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-cyan-600 block uppercase font-sans tracking-wide">AI Planner Setup</span>
                    <p className="text-slate-500 leading-relaxed font-sans">
                      To activate the Google Gemini AI predictive recommendations and stock warnings:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-500 font-sans text-[11px]">
                      <li>Open the **Secrets** panel in the app development environment settings.</li>
                      <li>Add your **GEMINI_API_KEY**.</li>
                      <li>The AI Planner tab will automatically load demand forecast guidance.</li>
                    </ol>
                  </div>

                  {/* RESET BUTTON */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between" id="settings-system-re-seed-action">
                    <div>
                      <span className="font-bold text-slate-800 block uppercase font-sans">Reset Store Database</span>
                      <p className="text-[11px] text-slate-400 font-sans">Resets products and cleans past transaction logs back to standard defaults.</p>
                    </div>

                    <button
                      onClick={handleSystemReSeed}
                      disabled={actionLoading}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all text-xs uppercase flex items-center gap-1.5 shadow-sm border border-rose-500/20 cursor-pointer"
                      id="reset-db-btn"
                    >
                      <Database className="w-3.5 h-3.5" />
                      {actionLoading ? "Seeding..." : "Reset Data"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Category Management Section */}
              <CategoryManager 
                categories={categories}
                ownerMode={ownerMode}
                onAddCategory={handleAddCategory}
                onModifyCategory={handleModifyCategory}
              />
            </div>
          )}

        </main>
      </div>

      {/* MODAL: STOCK LEDGER MOVEMENT AUDIT ADJUSTMENT */}
      {selectedProductForEvent && (
        <InventoryEventForm 
          product={selectedProductForEvent} 
          onSubmit={handleRecordEvent} 
          onClose={() => setSelectedProductForEvent(null)} 
        />
      )}

      {/* GOOGLE PROFILE WORKSPACE LOGO & IDENTITY CUSTOMIZER MODAL */}
      {isBrandModalOpen && (
        <BrandProfileModal 
          brandConfig={brandConfig}
          onSave={handleSaveBrandConfig}
          onClose={() => setIsBrandModalOpen(false)}
        />
      )}

      {/* QUICK NEW PRODUCT REGISTRATION ON UNRECOGNIZED SCAN */}
      {unregisteredBarcode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans text-left" id="unregistered-barcode-modal">
          <div className="bg-white rounded-2xl border-2 border-slate-350 w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-cyan-700 to-cyan-800 p-5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-white">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Unregistered Barcode Scanned</h4>
                  <p className="text-[10px] text-cyan-100 font-medium">Create a new accessory listing on the fly</p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const name = (target.elements.namedItem("prod_name") as HTMLInputElement).value;
              const brand = (target.elements.namedItem("prod_brand") as HTMLInputElement).value;
              const category = (target.elements.namedItem("prod_category") as HTMLSelectElement).value;
              const sellPrice = Number((target.elements.namedItem("prod_sell") as HTMLInputElement).value) || 0;
              const minStock = Number((target.elements.namedItem("prod_min") as HTMLInputElement).value) || 3;
              const sizeVariant = (target.elements.namedItem("prod_variant") as HTMLInputElement).value;
              const sku = (target.elements.namedItem("prod_sku") as HTMLInputElement).value;

              handleQuickRegisterProduct({
                name,
                brand,
                sku,
                sizeVariant,
                barcode: unregisteredBarcode,
                category,
                sellPrice,
                minStock
              });
            }} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Scanned Barcode</label>
                <input 
                  type="text" 
                  value={unregisteredBarcode} 
                  readOnly 
                  className="w-full bg-slate-50 border-2 border-slate-200 select-all p-2.5 rounded-lg font-mono text-slate-500 font-bold focus:outline-none cursor-default"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Generated SKU</label>
                  <input 
                    type="text" 
                    name="prod_sku"
                    required
                    defaultValue={`ACC-NEW-${unregisteredBarcode.slice(-4)}`}
                    className="w-full bg-white border-2 border-slate-300 p-2.5 rounded-lg font-mono text-slate-800 font-bold focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Category Division</label>
                  <select 
                    name="prod_category"
                    className="w-full bg-white border-2 border-slate-300 p-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-cyan-600"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Product Display Name</label>
                <input 
                  type="text" 
                  name="prod_name"
                  required 
                  placeholder="e.g. Steelbird Double Visor, Riding Belt L..." 
                  className="w-full bg-white border-2 border-slate-300 p-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Brand</label>
                  <input 
                    type="text" 
                    name="prod_brand"
                    required
                    placeholder="Axor"
                    className="w-full bg-white border-2 border-slate-300 p-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Size / Variant</label>
                  <input 
                    type="text" 
                    name="prod_variant"
                    required
                    placeholder="Helmet L"
                    className="w-full bg-white border-2 border-slate-300 p-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Min Stock</label>
                <input 
                  type="number" 
                  name="prod_min"
                  required
                  defaultValue="3"
                  min="0"
                  className="w-full bg-white border-2 border-slate-300 p-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex gap-2.5 pt-3.5 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setUnregisteredBarcode(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black tracking-wider uppercase py-3 rounded-xl transition cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-black tracking-wider uppercase py-3 rounded-xl transition shadow-md cursor-pointer border-0"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Registering..." : "Register & Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
