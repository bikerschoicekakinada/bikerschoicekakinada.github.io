export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  sizeVariant: string;
  barcode?: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
  createdAt: string;
  imagePath?: string;
  currentStock?: number; // Calculated dynamically
}

export type InventoryEventType = "STOCK_IN" | "SALE";

export interface InventoryEvent {
  id: string;
  productId: string;
  type: InventoryEventType;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  totalAmount?: number;
  note?: string;
  reason?: string;
  sessionId?: string;
  createdAt: string;
}

export interface IntakeSession {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string;
  label?: string;
  notes?: string;
}

export interface IntakeQueueItem {
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

export interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  productName?: string; // Extended for quick rendering
}

export interface ProductPerformance extends Product {
  currentStock: number;
  unitsSold: number;
  revenue: number;
  netProfit: number;
  daysUnsold: number;
  isLowStock: boolean;
  isDeadStock: boolean;
  isFastMoving: boolean;
}

export interface InventoryStats {
  totalProductsCount: number;
  currentStocks: Record<string, number>;
  totalMoneySpent: number;
  totalSalesAmount: number;
  totalInventoryValue: number;
  totalCostValuation: number;
  remainingStockValue: number;
  moneyRotation: number;
  lowStockAlertsCount: number;
  productPerformance: ProductPerformance[];
  eventsCount: number;
  salesCount: number;
  totalRevenueAccumulated: number;
  recentProductIds: string[];
}

export interface BrandConfig {
  type: "default" | "image" | "initials";
  imageUrl?: string;
  initials: string;
  color: string;
  name: string;
  subtext: string;
}

