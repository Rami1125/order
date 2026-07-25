export type DepositCategory = 'pallet' | 'big_bag' | 'skip' | 'block_pallet' | 'none';

export type ProductCategory =
  | 'חומרי מליאה ובלות'
  | 'צמנט ודבקים'
  | 'גבס ובידוד'
  | 'ברזל ורשתות'
  | 'איטום וגגות'
  | 'כלי עבודה וציוד'
  | 'בלוקים ותשתיות'
  | 'טיח ושליכט'
  | 'פרופילים ופינות'
  | 'חוקי לוגיסטיקה ושינוע';

export type ProductUnit = 'בלה' | 'שק' | 'טון' | 'מ"ר' | 'יחידה' | 'משטח' | 'גליל' | 'פח' | 'ערכה';

export interface LogisticsProduct {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  price?: number; // Deprecated/Removed
  depositCategory?: DepositCategory;
  depositPrice?: number; // Deprecated/Removed
  imageUrl: string;
  description: string;
  applicationGuide: string; // Technical & application specifications
  inStock: boolean;
  minOrderQuantity?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  depositPricePerUnit?: number;
  depositTotal?: number;
  totalPrice?: number;
}

export type OrderStatus = 'התקבלה' | 'בטיפול לוגיסטי' | 'על המשאית' | 'סופקה' | 'ממתינה לאישור' | 'הזמנה ממתינה לשיוך';

export interface Order {
  id: string; // e.g. ORD-2026-8812
  customerId: string;
  customerName: string;
  companyName: string;
  date: string; // ISO or YYYY-MM-DD HH:mm
  items: OrderItem[];
  subtotal?: number;
  totalDeposit?: number;
  deliveryFee?: number;
  grandTotal?: number;
  status: OrderStatus;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  sourceSheet?: 'הזמנות מלקוחות' | 'לוג_הזמנות_מערכת';
}

export interface Customer {
  id: string;
  name: string; // Contact person first name
  fullName: string;
  company: string;
  token: string; // Magic Link encrypted token identifier
  phone: string;
  email: string;
  deliveryAddress: string;
  creditLimit?: number;
  currentBalance?: number;
  avatarUrl?: string;
}

export interface LogisticsRule {
  id: string;
  category: 'delivery' | 'minimums' | 'discounts' | 'credit' | 'safety' | 'deposits';
  title: string;
  description: string;
  active: boolean;
  numericValue?: number;
  unit?: string;
  updatedAt: string;
}

export interface CacheEntry {
  id: string;
  queryKey: string; // Normalized Hebrew phrase or intent key
  category: string;
  responseHtml: string;
  responseData?: {
    suggestedOrderItems?: OrderItem[];
    ruleApplied?: string;
    actionType?: 'product_info' | 'order_draft' | 'rule_explanation' | 'application_guide';
  };
  hitCount: number;
  tokensSavedCount: number;
  lastUsed: string;
  createdAt: string;
}

export interface ChatAttachment {
  name: string;
  sizeKb: number;
  type: string;
  drivePath: string;
  dataUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'noa';
  text?: string;
  htmlContent?: string;
  timestamp: string;
  isCached?: boolean;
  cachedEntryId?: string;
  attachment?: ChatAttachment;
  pendingOrderDraft?: {
    items: OrderItem[];
    subtotal: number;
    totalDeposit: number;
    deliveryFee: number;
    grandTotal: number;
    deliveryAddress: string;
  };
  orderConfirmedId?: string;
}

export interface CacheStats {
  totalHits: number;
  totalTokensSaved: number;
  totalApiCallsSaved: number;
  estimatedEnergySavedWh: number;
  cacheHitRatioPercent: number;
}
