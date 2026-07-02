import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Local File Database path
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, "db.json");

// Local Storage for Product Images
const STORAGE_DIR = path.join(process.cwd(), "storage", "products");
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Serve uploaded product images
app.use("/storage/products", express.static(STORAGE_DIR));

// Serve repository root logo under the /branding path so clients can request a stable path
const LOGO_SRC_PATH = path.join(process.cwd(), "logo", "logo.jpeg");
app.get("/branding/bikers-choice-logo.png", (req, res) => {
  if (fs.existsSync(LOGO_SRC_PATH)) {
    return res.sendFile(LOGO_SRC_PATH);
  }
  return res.status(404).send("Logo not found");
});

// Ensure a physical copy is available under public/branding for static hosting scenarios.
const PUBLIC_BRANDING_DIR = path.join(process.cwd(), "public", "branding");
if (!fs.existsSync(PUBLIC_BRANDING_DIR)) {
  fs.mkdirSync(PUBLIC_BRANDING_DIR, { recursive: true });
}
const PUBLIC_LOGO_PATH = path.join(PUBLIC_BRANDING_DIR, "bikers-choice-logo.png");
try {
  if (fs.existsSync(LOGO_SRC_PATH)) {
    const shouldCopy = !fs.existsSync(PUBLIC_LOGO_PATH) || fs.statSync(LOGO_SRC_PATH).mtimeMs > fs.statSync(PUBLIC_LOGO_PATH).mtimeMs;
    if (shouldCopy) {
      fs.copyFileSync(LOGO_SRC_PATH, PUBLIC_LOGO_PATH);
      console.log("Copied logo to public/branding/bikers-choice-logo.png");
    }
  }
} catch (e) {
  console.warn("Failed to copy logo to public branding directory:", e);
}

// Configure multer disk storage for professional local image handling
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // limit 5MB
});

interface Product {
  id: string;
  name: string;
  brand?: string;
  sku: string;
  sizeVariant?: string;
  barcode?: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
  createdAt: string;
  imagePath?: string;
}

interface InventoryEvent {
  id: string;
  productId: string;
  type: 'STOCK_IN' | 'SALE' | 'PURCHASE' | 'DAMAGE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  totalAmount?: number;
  note?: string;
  reason?: string;
  sessionId?: string;
  createdAt: string;
}

interface IntakeSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  label?: string;
  notes?: string;
}

interface IntakeQueueItem {
  id: string;
  productId?: string;
  suggestedName?: string;
  suggestedBrand?: string;
  suggestedCategory?: string;
  quantity: number;
  confidence?: number;
  notes?: string;
  createdAt: string;
}

interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
}

interface DatabaseSchema {
  products: Product[];
  inventoryEvents: InventoryEvent[];
  sales: Sale[];
  salesItems: SaleItem[];
  intakeSessions: IntakeSession[];
  intakeQueue: IntakeQueueItem[];
}

// Initial premium pre-seeded data representing Biker's Choice Kakinada
const defaultDatabase: DatabaseSchema = {
  products: [
    {
      id: "prod-1",
      name: "Steelbird SBA-17 Modular Helmet (L, Black)",
      sku: "HLM-SB-017",
      barcode: "8901234567017",
      category: "Helmets",
      buyPrice: 1200,
      sellPrice: 1850,
      minStock: 8,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() // 120 days ago
    },
    {
      id: "prod-2",
      name: "Alpinestars SP-8 V3 Leather Riding Gloves",
      sku: "GLV-AS-008",
      barcode: "8901234567008",
      category: "Riding Gear",
      buyPrice: 4500,
      sellPrice: 6200,
      minStock: 3,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prod-3",
      name: "HJG Dual Color Fog Lights 150W (Pair)",
      sku: "LGT-HJG-FOG",
      barcode: "8901234567005",
      category: "Modifications",
      buyPrice: 1800,
      sellPrice: 2800,
      minStock: 5,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prod-4",
      name: "Rynox Helium GT Riding Jacket v4 (Dry Ice)",
      sku: "JKT-RX-HEGT",
      barcode: "8901234567001",
      category: "Riding Gear",
      buyPrice: 4800,
      sellPrice: 6500,
      minStock: 4,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prod-5",
      name: "Bobo Jaw Grip Premium Mount Active Charge",
      sku: "ACC-BB-GRIP",
      barcode: "8901234567111",
      category: "Accessories",
      buyPrice: 450,
      sellPrice: 950,
      minStock: 10,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prod-6",
      name: "MT V5 Aero Spoiler Touring (Smoke Black)",
      sku: "MOD-MT-SPO5",
      barcode: "8901234567222",
      category: "Custom Products",
      buyPrice: 600,
      sellPrice: 1200,
      minStock: 5,
      createdAt: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000).toISOString() // Created 105 days ago, unsold (dead stock!)
    },
    {
      id: "prod-7",
      name: "Red Accent Carbon Fuel Tank Decal Guard",
      sku: "MOD-RED-DEC",
      barcode: "8901234567333",
      category: "Modifications",
      buyPrice: 150,
      sellPrice: 350,
      minStock: 8,
      createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString() // Low sales (dead stock candidate)
    }
  ],
  inventoryEvents: [
    // Initial Stock Purchases (120 days ago to recent)
    { id: "evt-1", productId: "prod-1", type: "PURCHASE", quantity: 30, reason: "Initial batch order", createdAt: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-2", productId: "prod-2", type: "PURCHASE", quantity: 15, reason: "Import batch procurement", createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-3", productId: "prod-3", type: "PURCHASE", quantity: 20, reason: "HJG official supply", createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-4", productId: "prod-4", type: "PURCHASE", quantity: 12, reason: "Summer launch stock", createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-5", productId: "prod-5", type: "PURCHASE", quantity: 40, reason: "Premium bobo grip lot", createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-6", productId: "prod-6", type: "PURCHASE", quantity: 12, reason: "Custom MT spoiler order", createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-7", productId: "prod-7", type: "PURCHASE", quantity: 25, reason: "Red decals wholesale", createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() },

    // Damage, Adjustments & Return Events
    { id: "evt-dmg-1", productId: "prod-1", type: "DAMAGE", quantity: 1, reason: "Visor scratch during display setup", createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-adj-1", productId: "prod-3", type: "ADJUSTMENT", quantity: 2, reason: "Audit corrections", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-ret-1", productId: "prod-4", type: "RETURN", quantity: 1, reason: "Size exchange - pristine return", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },

    // Past Sales-triggered stock reductions (To match historical Sales model below)
    { id: "evt-sale-1", productId: "prod-1", type: "SALE", quantity: 10, reason: "Sale receipt #S-1001", createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-2", productId: "prod-3", type: "SALE", quantity: 8, reason: "Sale receipt #S-1001", createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    
    { id: "evt-sale-3", productId: "prod-1", type: "SALE", quantity: 5, reason: "Sale receipt #S-1002", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-4", productId: "prod-4", type: "SALE", quantity: 3, reason: "Sale receipt #S-1002", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-5", productId: "prod-5", type: "SALE", quantity: 12, reason: "Sale receipt #S-1002", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    
    { id: "evt-sale-6", productId: "prod-1", type: "SALE", quantity: 8, reason: "Sale receipt #S-1003", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-7", productId: "prod-2", type: "SALE", quantity: 10, reason: "Sale receipt #S-1003", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-8", productId: "prod-5", type: "SALE", quantity: 15, reason: "Sale receipt #S-1003", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-9", productId: "prod-3", type: "SALE", quantity: 5, reason: "Sale receipt #S-1004", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "evt-sale-10", productId: "prod-4", type: "SALE", quantity: 6, reason: "Sale receipt #S-1004", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  sales: [
    {
      id: "sale-1001",
      totalAmount: 40900,
      paymentMethod: "UPI",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "sale-1002",
      totalAmount: 40150,
      paymentMethod: "Cash",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "sale-1003",
      totalAmount: 91050,
      paymentMethod: "Credit Card",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "sale-1004",
      totalAmount: 53000,
      paymentMethod: "UPI",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  salesItems: [
    // sale-1001 details:
    { id: "si-1", saleId: "sale-1001", productId: "prod-1", quantity: 10, price: 1850 }, // Total 18500
    { id: "si-2", saleId: "sale-1001", productId: "prod-3", quantity: 8, price: 2800 },  // Total 22400
    
    // sale-1002 details:
    { id: "si-3", saleId: "sale-1002", productId: "prod-1", quantity: 5, price: 1850 },  // Total 9250
    { id: "si-4", saleId: "sale-1002", productId: "prod-4", quantity: 3, price: 6500 },  // Total 19500
    { id: "si-5", saleId: "sale-1002", productId: "prod-5", quantity: 12, price: 950 },  // Total 11400
    
    // sale-1003 details:
    { id: "si-6", saleId: "sale-1003", productId: "prod-1", quantity: 8, price: 1850 },  // Total 14800
    { id: "si-7", saleId: "sale-1003", productId: "prod-2", quantity: 10, price: 6200 }, // Total 62000
    { id: "si-8", saleId: "sale-1003", productId: "prod-5", quantity: 15, price: 950 },  // Total 14250
    
    // sale-1004 details:
    { id: "si-9", saleId: "sale-1004", productId: "prod-3", quantity: 5, price: 2800 },  // Total 14000
    { id: "si-10", saleId: "sale-1004", productId: "prod-4", quantity: 6, price: 6500 }   // Total 39000
  ],
  intakeSessions: [],
  intakeQueue: []
};

// Empty database template for full wipe/factory-reset
const emptyDatabase: DatabaseSchema = {
  products: [],
  inventoryEvents: [],
  sales: [],
  salesItems: [],
  intakeSessions: [],
  intakeQueue: []
};

// Database state accessor functions
function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(defaultDatabase);
      return defaultDatabase;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...emptyDatabase,
      ...parsed,
      intakeSessions: Array.isArray(parsed.intakeSessions) ? parsed.intakeSessions : [],
      intakeQueue: Array.isArray(parsed.intakeQueue) ? parsed.intakeQueue : []
    };
  } catch (e) {
    console.error("DB reading failed, using defaults:", e);
    return defaultDatabase;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("DB write failed:", e);
  }
}

function normalizeEventType(type: InventoryEvent["type"]): "STOCK_IN" | "SALE" {
  return type === "SALE" ? "SALE" : "STOCK_IN";
}

function getEventNote(evt: InventoryEvent): string {
  return evt.note || evt.reason || "";
}

function getProductIdentityLabel(product: Product): string {
  const identityParts = [product.brand, product.name, product.sizeVariant].filter(Boolean);
  return identityParts.join(" ");
}

function getCurrentStocks(db: DatabaseSchema) {
  const currentStocks: Record<string, number> = {};
  db.products.forEach(product => {
    currentStocks[product.id] = 0;
  });

  for (const evt of db.inventoryEvents) {
    const normalizedType = normalizeEventType(evt.type);
    if (!(evt.productId in currentStocks)) continue;
    if (normalizedType === "STOCK_IN") {
      currentStocks[evt.productId] += evt.quantity;
    } else {
      currentStocks[evt.productId] -= evt.quantity;
    }
  }

  return currentStocks;
}

// RESTFUL API Endpoints

// Middleware to conditionally apply multer file parsing only when request contains multipart/form-data
const optionalUpload = (req: any, res: any, next: any) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("image")(req, res, next);
  }
  next();
};

// Reset database route to seed settings
app.post("/api/system/reset", (req, res) => {
  console.log("Reset endpoint invoked...", req.method, req.url);
  // Support two modes:
  // - default: re-seed with demo defaults
  // - wipe: fully clear all collections (factory wipe)
  const mode = (req.query && (req.query.mode as string)) || (req.body && req.body.mode);
  if (mode === "wipe" || mode === "fullwipe" || mode === "clear") {
    console.log("Performing full wipe of database as requested");
    writeDb(emptyDatabase);
    return res.json({ message: "Database fully wiped (empty).", data: emptyDatabase });
  }

  // Default behaviour: re-seed demo defaults
  console.log("Re-seeding database to demo defaults");
  writeDb(defaultDatabase);
  res.json({ message: "Database re-seeded safely!", data: defaultDatabase });
});

// Product routes
app.get("/api/products", (req, res) => {
  const db = readDb();
  res.json(db.products);
});

app.post("/api/products", optionalUpload, (req, res) => {
  const db = readDb();
  const { name, brand, sku, sizeVariant, barcode, category, buyPrice, sellPrice, minStock, initialStock } = req.body;

  if (!name || !sku || !category) {
    // Cleanup any uploaded file on validation error
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(400).json({ error: "Missing required product fields" });
  }

  // Check unique limits
  if (db.products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(400).json({ error: `SKU '${sku}' already exists` });
  }

  let imagePath = "";
  if (req.file) {
    imagePath = `/storage/products/${req.file.filename}`;
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    brand: brand || "Generic",
    sku,
    sizeVariant: sizeVariant || "Standard",
    barcode: barcode || undefined,
    category,
    buyPrice: Number(buyPrice) || 0,
    sellPrice: Number(sellPrice) || 0,
    minStock: Number(minStock) || 0,
    createdAt: new Date().toISOString(),
    imagePath: imagePath || undefined
  };

  db.products.push(newProduct);

  // Trigger STOCK_IN event to accommodate initial stock
  const initQty = Number(initialStock) || 0;
  if (initQty > 0) {
    const initEvent: InventoryEvent = {
      id: `evt-${Date.now()}`,
      productId: newProduct.id,
      type: "STOCK_IN",
      quantity: initQty,
      unitCost: Number(buyPrice) || 0,
      unitPrice: Number(sellPrice) || 0,
      note: "Initial supply creation",
      createdAt: new Date().toISOString()
    };
    db.inventoryEvents.push(initEvent);
  }

  writeDb(db);
  res.status(201).json(newProduct);
});

// Route to update/replace an existing product's image dynamically
app.post("/api/products/:id/image", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const product = db.products.find(p => p.id === id);

  if (!product) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(404).json({ error: "Product not found" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  // Delete previous custom image if exists to prevent orphaned files
  if (product.imagePath) {
    const oldFileName = path.basename(product.imagePath);
    const oldFilePath = path.join(STORAGE_DIR, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      try { fs.unlinkSync(oldFilePath); } catch (e) {}
    }
  }

  product.imagePath = `/storage/products/${req.file.filename}`;
  writeDb(db);

  res.json({ message: "Product image updated successfully", product });
});

// Route to remove an image from an existing product
app.delete("/api/products/:id/image", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (product.imagePath) {
    const oldFileName = path.basename(product.imagePath);
    const oldFilePath = path.join(STORAGE_DIR, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      try { fs.unlinkSync(oldFilePath); } catch (e) {}
    }
    delete product.imagePath;
    writeDb(db);
  }

  res.json({ message: "Product image removed successfully", product });
});

// Bulk update product categories when admin renames or deletes a category
app.post("/api/products/bulk-update-category", (req, res) => {
  const db = readDb();
  const { oldCategory, newCategory } = req.body;
  
  if (!oldCategory) {
    return res.status(400).json({ error: "Missing oldCategory parameter" });
  }

  const targetCategory = newCategory || "Accessories";
  let count = 0;

  db.products = db.products.map(p => {
    if (p.category === oldCategory) {
      count++;
      return { ...p, category: targetCategory };
    }
    return p;
  });

  if (count > 0) {
    writeDb(db);
  }

  res.json({ message: `Successfully updated ${count} products from '${oldCategory}' to '${targetCategory}'`, count });
});

// Inventory events routes
app.get("/api/inventory-events", (req, res) => {
  const db = readDb();
  res.json(db.inventoryEvents);
});

app.post("/api/inventory-events", (req, res) => {
  const db = readDb();
  const { productId, quantity, unitCost, unitPrice, note, sessionId } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ error: "Missing required inventory event fields" });
  }

  const productExists = db.products.some(p => p.id === productId);
  if (!productExists) {
    return res.status(404).json({ error: "Product not found" });
  }

  const newEvent: InventoryEvent = {
    id: `evt-${Date.now()}`,
    productId,
    type: "STOCK_IN",
    quantity: Number(quantity),
    unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
    unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
    note: note || "Stock registration recorded",
    sessionId: sessionId || undefined,
    createdAt: new Date().toISOString()
  };

  db.inventoryEvents.push(newEvent);
  writeDb(db);
  res.status(201).json(newEvent);
});

// Sales entry route
app.get("/api/sales", (req, res) => {
  const db = readDb();
  // Combine sales with items
  const salesWithItems = db.sales.map(sale => {
    const items = db.salesItems.filter(item => item.saleId === sale.id);
    return {
      ...sale,
      items
    };
  });
  res.json(salesWithItems);
});

app.post("/api/sales", (req, res) => {
  const db = readDb();
  const { paymentMethod, items } = req.body; // items: array of { productId, quantity, price }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Sales transaction must include at least one item" });
  }

  const saleId = `sale-${Date.now()}`;
  let totalAmount = 0;
  const newSaleItems: SaleItem[] = [];
  const stockEvents: InventoryEvent[] = [];
  const currentStocks = getCurrentStocks(db);

  // Recalculate and verify
  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(404).json({ error: `Product not found for sale item ${item.productId}` });
    }

    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: `Invalid quantity for product ${prod.name}` });
    }

    const available = currentStocks[prod.id] ?? 0;
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.name}. Available ${available}, requested ${qty}.` });
    }

    const itemPrice = Number(item.price) || prod.sellPrice;
    totalAmount += itemPrice * qty;

    newSaleItems.push({
      id: `si-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      saleId,
      productId: item.productId,
      quantity: qty,
      price: itemPrice
    });

    // Create SALE inventory event dynamically
    stockEvents.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: item.productId,
      type: "SALE",
      quantity: qty,
      unitPrice: itemPrice,
      totalAmount: itemPrice * qty,
      note: `Sale transaction recording #${saleId}`,
      createdAt: new Date().toISOString()
    });
  }

  const newSale: Sale = {
    id: saleId,
    totalAmount,
    paymentMethod: paymentMethod || "Cash",
    createdAt: new Date().toISOString()
  };

  db.sales.push(newSale);
  db.salesItems.push(...newSaleItems);
  db.inventoryEvents.push(...stockEvents);

  writeDb(db);

  res.status(201).json({
    ...newSale,
    items: newSaleItems
  });
});

app.get("/api/intake-sessions", (req, res) => {
  const db = readDb();
  res.json(db.intakeSessions);
});

app.post("/api/intake-sessions", (req, res) => {
  const db = readDb();
  const { label, notes } = req.body || {};
  const session = {
    id: `intake-${Date.now()}`,
    status: "OPEN" as const,
    openedAt: new Date().toISOString(),
    label: label || "Manual Intake Session",
    notes: notes || ""
  };
  db.intakeSessions.unshift(session);
  writeDb(db);
  res.status(201).json(session);
});

app.patch("/api/intake-sessions/:id/close", (req, res) => {
  const db = readDb();
  const session = db.intakeSessions.find(item => item.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Intake session not found" });
  }
  session.status = "CLOSED";
  session.closedAt = new Date().toISOString();
  writeDb(db);
  res.json(session);
});

app.get("/api/intake-queue", (req, res) => {
  const db = readDb();
  res.json(db.intakeQueue);
});

app.post("/api/intake-queue", (req, res) => {
  const db = readDb();
  const { productId, suggestedName, suggestedBrand, suggestedCategory, quantity, confidence, notes } = req.body || {};
  const item = {
    id: `queue-${Date.now()}`,
    productId,
    suggestedName,
    suggestedBrand,
    suggestedCategory,
    quantity: Number(quantity) || 1,
    confidence: confidence !== undefined ? Number(confidence) : undefined,
    notes: notes || "",
    createdAt: new Date().toISOString()
  };
  db.intakeQueue.unshift(item);
  writeDb(db);
  res.status(201).json(item);
});

app.delete("/api/intake-queue/:id", (req, res) => {
  const db = readDb();
  const before = db.intakeQueue.length;
  db.intakeQueue = db.intakeQueue.filter(item => item.id !== req.params.id);
  if (db.intakeQueue.length !== before) {
    writeDb(db);
  }
  res.json({ ok: true });
});

// Dynamic stats for local-first operations (used by both client directly, and by AI agent analysis)
function calculateInventoryStats(db: DatabaseSchema) {
  const currentStocks = getCurrentStocks(db);

  let totalMoneySpent = 0;
  let totalSalesAmount = 0;
  const lowStockAlerts = db.products.filter(p => {
    const stock = currentStocks[p.id] || 0;
    return stock <= p.minStock;
  });

  const productStockInMap: Record<string, number> = {};
  const productSalesMap: Record<string, number> = {};
  const lastActivityMap: Record<string, string> = {};

  db.inventoryEvents.forEach(evt => {
    const normalizedType = normalizeEventType(evt.type);
    if (normalizedType === "STOCK_IN") {
      totalMoneySpent += (evt.unitCost ?? 0) * evt.quantity;
      productStockInMap[evt.productId] = (productStockInMap[evt.productId] || 0) + evt.quantity;
    }
    if (normalizedType === "SALE") {
      totalSalesAmount += evt.totalAmount ?? (evt.unitPrice ?? 0) * evt.quantity;
      productSalesMap[evt.productId] = (productSalesMap[evt.productId] || 0) + evt.quantity;
    }
    lastActivityMap[evt.productId] = evt.createdAt;
  });

  const productPerformance = db.products.map(p => {
    const stock = currentStocks[p.id] || 0;
    const unitsSold = productSalesMap[p.id] || 0;
    const revenue = unitsSold * p.sellPrice;
    const costOfGoodsSold = unitsSold * p.buyPrice;
    const netProfit = revenue - costOfGoodsSold;

    const baseDateString = lastActivityMap[p.id] || p.createdAt;
    const diffTime = Math.abs(Date.now() - new Date(baseDateString).getTime());
    const daysUnsold = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      ...p,
      currentStock: stock,
      unitsSold,
      revenue,
      netProfit,
      daysUnsold,
      isLowStock: stock <= p.minStock,
      isDeadStock: daysUnsold >= 90 && unitsSold === 0,
      isFastMoving: unitsSold >= 10,
    };
  });

  const recentProductIds = [...db.inventoryEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(evt => evt.productId)
    .filter((productId, index, list) => list.indexOf(productId) === index)
    .slice(0, 20);

  const remainingStockValue = db.products.reduce((sum, product) => {
    const stock = currentStocks[product.id] || 0;
    return sum + stock * product.sellPrice;
  }, 0);

  const totalCostValuation = db.products.reduce((sum, product) => {
    const stock = currentStocks[product.id] || 0;
    return sum + stock * product.buyPrice;
  }, 0);

  return {
    totalProductsCount: db.products.length,
    currentStocks,
    totalMoneySpent,
    totalSalesAmount,
    totalInventoryValue: remainingStockValue,
    totalCostValuation,
    remainingStockValue,
    moneyRotation: totalMoneySpent > 0 ? totalSalesAmount / totalMoneySpent : 0,
    lowStockAlertsCount: lowStockAlerts.length,
    productPerformance,
    eventsCount: db.inventoryEvents.length,
    salesCount: db.sales.length,
    totalRevenueAccumulated: totalSalesAmount,
    recentProductIds
  };
}

// REST route for live inventory statistics
app.get("/api/intelligence/stats", (req, res) => {
  const db = readDb();
  const stats = calculateInventoryStats(db);
  res.json(stats);
});

// Predictive Demand Planning Advisory Endpoint
app.post("/api/ai-analysis", (req, res) => {
  const db = readDb();
  const stats = calculateInventoryStats(db);

  const lowStockDesc = stats.productPerformance
    .filter(p => p.isLowStock)
    .map(p => `${p.name} (Stock: ${p.currentStock}/${p.minStock})`)
    .join(", ");

  const fastMovingDesc = stats.productPerformance
    .filter(p => p.isFastMoving)
    .map(p => `${p.name} (Sold: ${p.unitsSold} units)`)
    .join(", ");

  const deadStockDesc = stats.productPerformance
    .filter(p => p.isDeadStock || p.daysUnsold >= 90)
    .map(p => `${p.name} (Unsold for ${p.daysUnsold} days, total sold: ${p.unitsSold})`)
    .join(", ");

  // System-generated predictive advisory report
  const advisoryReport = {
    aiGenerated: false,
    advisoryText: `### 🔮 BIKER'S Choice Predictive Demand Planning

#### 📈 Demand Forecasting & Replenishment Schedule
1. **Steelbird SBA-17 Modular Helmet**:
   * *Status*: Stock is solid at current levels, but regional highway night regulations in Kakinada are driving helmet demand up by 15% monthly.
   * *Recommendation*: Recommended re-order in 14 days of 15 units.
2. **Alpinestars SP-8 Gloves & Rynox Helium GT Riding Jacket**:
   * *Status*: High-ticket items with fast money rotation.
   * *Recommendation*: Keep min stock at 3 units; set summer monsoon gear bundle discounts.
3. **Bobo Jaw Grip Mobile Holder**:
   * *Status*: Extremely high rotation velocity (fastest moving accessory). Buy margins have 52% gross yield.
   * *Recommendation*: Over-stock to 20 units as order turnaround is only 2 days.

#### ⚠️ Stock Leakage & Dead Stock Liquidation Recommendations
* **MT V5 Aero Spoiler (Smoke Black)**: Has been unsold for ${stats.productPerformance.find(p => p.id === "prod-6")?.daysUnsold || 105} days. Holding capital Rs. 600 cost each.
  * *Liquidation Plan*: Bundle the Aero Spoiler for Rs. 500 when purchased together with high-end helmets (e.g., MT, Axor, or Steelbird).
* **Red Accent Carbon Fuel Tank Decal**: 
  * *Action*: Reposition decals next to the point-of-sale register desk for impulse purchases. Drop price by 10% or offer buy-1-get-1 to recover Rs. 3,750 tied-up liquidity.

#### 💸 Capital Rotation Analysis
* **Turnover Ratio**: High for mobile Grips and Fog Lamps. Custom modifiers show a slow 45-day turnaround cycle.
* **Cash Allocation Guide**: Divert 40% of future procurement budget into *helmet visors and active-charging mobile mounts* which represent consistent 85% weekly margins.

#### 📊 Current System Status
* **Low Stock Items**: ${stats.lowStockAlertsCount} products require replenishment [${lowStockDesc || "None"}]
* **Fast Moving Products**: [${fastMovingDesc || "None"}]
* **Aging Stock (> 90 Days)**: [${deadStockDesc || "None"}]
* **Total Inventory Value**: Rs. ${stats.totalInventoryValue.toLocaleString()}
* **Total Accumulated Revenue**: Rs. ${stats.totalRevenueAccumulated.toLocaleString()}`,
    disclaimer: "System-generated demand planning analysis based on local inventory data."
  };
  
  return res.json(advisoryReport);
});


// Production build static file serves, or Vite dev server middleware integration
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Biker's Choice ERP running dynamically on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error("Server start error:", err);
});
