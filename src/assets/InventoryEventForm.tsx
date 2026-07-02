import React, { useState } from "react";
import { Activity, XCircle, Image as ImageIcon } from "lucide-react";
import { Product } from "../types";

interface InventoryEventFormProps {
  product: Product;
  onSubmit: (data: {
    productId: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    note: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

export default function InventoryEventForm({ product, onSubmit, onClose }: InventoryEventFormProps) {
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState(String(product.buyPrice || 0));
  const [unitPrice, setUnitPrice] = useState(String(product.sellPrice || 0));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError("Please specify a valid stock quantity count.");
      return;
    }

    setLoading(true);
    try {
      const isOk = await onSubmit({
        productId: product.id,
        quantity: qtyNum,
        unitCost: Number(unitCost) || 0,
        unitPrice: Number(unitPrice) || Number(product.sellPrice) || 0,
        note: note.trim() || "Stock registration event"
      });

      if (isOk) {
        onClose();
      } else {
        setError("Stock audit submission rejected on host node.");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to indicate impact direction
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="event-form-overlay">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up" id="event-form-dialog">
        {/* Dialog Header */}
        <div className="bg-slate-50 text-slate-800 p-5 flex items-center justify-between select-none border-b border-slate-200" id="event-dialog-header">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider font-sans">Register Stock Intake</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Dialog Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" id="inventory-ledger-event-form">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-705 text-xs py-2 px-3 rounded font-sans" id="event-form-err">
              {error}
            </div>
          )}

          {/* Product Reference Card with Visual Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex gap-3 items-center" id="product-static-ref-info">
            <div className="w-12 h-12 rounded bg-white border border-slate-205 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
              {product.imagePath ? (
                <img
                  src={product.imagePath}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-slate-350" />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-[5px] text-center uppercase tracking-widest text-white font-bold py-0.5">
                VERIFIED
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold text-slate-450 block uppercase font-sans tracking-wider">
                Target Stock Item (Visual Verified)
              </span>
              <div className="font-bold text-slate-800 mt-0.5 text-xs truncate" title={product.name}>{product.name}</div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-1 font-sans">
                <span>SKU: {product.sku}</span>
                <span>Retail Price: Rs. {product.sellPrice}</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 mt-1">
                {product.brand || "Generic"} / {product.sizeVariant || "Standard"}
              </div>
            </div>
          </div>

          {/* Impact feedback */}
          <div className="p-2.5 rounded text-[10px] font-bold text-center border font-sans bg-emerald-50 text-emerald-700 border-emerald-100">
            📈 This stock intake will increase the dynamic current stock total.
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 20].map(step => (
              <button
                key={step}
                type="button"
                onClick={() => setQuantity(String(step))}
                className="py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 cursor-pointer"
              >
                +{step}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Quantity Received *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 5"
              className="w-full text-xs text-slate-705 p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
              min="1"
              required
              id="event-quantity-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Buying Price *</label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full text-xs text-slate-705 p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Selling Price *</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full text-xs text-slate-705 p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider font-sans">Intake notes</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Box arrived safe from Delhi courier, physical audit verify."
              rows={3}
              className="w-full text-xs text-slate-705 p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
              id="event-reason-input"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100" id="event-dialog-controls">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-slate-500 hover:bg-slate-50 border border-slate-200 text-xs font-bold py-2.5 rounded-lg text-center cursor-pointer uppercase font-sans text-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-xs font-bold py-2.5 rounded-lg select-none cursor-pointer uppercase font-sans text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
              ) : (
                "Save & Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
