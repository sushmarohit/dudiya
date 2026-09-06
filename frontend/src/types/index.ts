export type UserRole = "ADMIN" | "DISTRIBUTOR" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SetupStatus = "INCOMPLETE" | "GO_LIVE";
export type AddressType = "URBAN" | "RURAL";
export type OnboardedVia = "DISTRIBUTOR_LED" | "SELF_SERVICE";
export type SubscriptionFrequency =
  | "DAILY"
  | "ALTERNATE_DAY"
  | "WEEKDAYS"
  | "WEEKLY"
  | "MONTHLY";
export type SubscriptionStatus =
  | "ACTIVE"
  | "PAUSED"
  | "PENDING_APPROVAL"
  | "PENDING_CANCEL"
  | "CANCELLED"
  | "REJECTED";
export type DeliveryItemStatus = "PENDING" | "DELIVERED" | "SKIPPED" | "FAILED";
export type BillStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";
export type PaymentMethod = "CASH" | "UPI" | "BANK" | "OTHER";
export type BillAdjustmentType = "CREDIT" | "DEBIT";
export type BillingCycle = "WEEKLY" | "BI_WEEKLY" | "MONTHLY";
export type NotificationType =
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_REQUESTED"
  | "SUBSCRIPTION_REJECTED"
  | "PAUSE_APPLIED"
  | "EXTRA_MILK_REQUEST"
  | "BILL_GENERATED"
  | "PAYMENT_RECORDED"
  | "DISTRIBUTOR_APPROVED"
  | "DELIVERY_FAILED_SKIPPED"
  | "DELIVERY_REMINDER"
  | "SUBSCRIPTION_END_REQUESTED"
  | "SUBSCRIPTION_END_CONFIRMED"
  | "SUBSCRIPTION_END_REJECTED"
  | "DISTRIBUTOR_UNAVAILABLE"
  | "DELIVERY_JOURNEY_STARTED";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ProductCategory =
  | "MILK"
  | "CURD"
  | "PANEER"
  | "EGGS"
  | "LASSI"
  | "GHEE"
  | "BUTTER"
  | "KHOYA";

export type ProductScope = "GLOBAL" | "DISTRIBUTOR";

export type ProductPromotionStatus =
  | "NONE"
  | "PRIVATE"
  | "PENDING_REVIEW"
  | "PROMOTED"
  | "REJECTED";
export type MilkSpecies = "COW" | "BUFFALO" | "GOAT" | "CAMEL";

export type PreferredLocale = "en" | "hi";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  preferredLocale?: PreferredLocale;
}

export interface ApiError {
  message: string | string[];
  statusCode?: number;
  error?: string;
  code?: string;
  params?: Record<string, string | number>;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface StructuredAddressFields {
  addressType?: AddressType;
  flatOrHouseNo?: string | null;
  buildingOrSociety?: string | null;
  streetOrLane?: string | null;
  landmark?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  addressLine?: string | null;
  formattedAddress?: string | null;
  city?: string | null;
  pincode?: string | null;
}

export interface DistributorProfile extends StructuredAddressFields {
  id: string;
  userId: string;
  businessName: string;
  ownerName?: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
  setupStatus: SetupStatus;
  setupSteps: string[];
  serviceLat?: number | null;
  serviceLng?: number | null;
  serviceRadiusKm: number;
  identityVerified?: boolean;
  goLiveAt?: string | null;
  readiness?: { ready: boolean; missing: string[] };
  createdAt?: string;
  user?: User;
}

export interface CustomerProfile extends StructuredAddressFields {
  id: string;
  userId: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  identityVerified?: boolean;
  user?: User;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  species?: MilkSpecies | null;
  unit: string;
  active: boolean;
  scope?: ProductScope;
  promotionStatus?: ProductPromotionStatus;
  ownerDistributorId?: string | null;
  enabled?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ownerDistributor?: {
    id: string;
    businessName: string;
    city?: string | null;
  };
}

export interface Pricing {
  id: string;
  distributorId: string;
  productId: string;
  fatPercent?: number | null;
  pricePerUnit: number;
  effectiveFrom: string;
  active: boolean;
  product?: Product;
}

export interface DeliverySlot {
  id: string;
  distributorId: string;
  label: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface Subscription {
  id: string;
  distributorId: string;
  customerId: string;
  productId: string;
  pricingId?: string | null;
  quantity: number;
  frequency: SubscriptionFrequency;
  deliverySlotId: string;
  startDate: string;
  status: SubscriptionStatus;
  createdVia: OnboardedVia;
  fatPercent?: number | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  endedAt?: string | null;
  product?: Product;
  deliverySlot?: DeliverySlot;
  customer?: CustomerProfile;
  distributor?: DistributorProfile;
}

export interface SubscriptionPause {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  requestedAt: string;
}

export interface SubscriptionExtra {
  id: string;
  subscriptionId: string;
  date: string;
  extraQuantity: number;
  status: RequestStatus;
  requestedAt: string;
}

/** Flat customer row returned by GET /distributor/customers (customer profile + link fields). */
export interface DistributorCustomerListItem extends CustomerProfile {
  onboardedVia: OnboardedVia;
  linkedAt?: string;
  user?: User;
}

/** Link join row (used when nested customer is present). */
export interface DistributorCustomer {
  id: string;
  distributorId: string;
  customerId: string;
  onboardedVia: OnboardedVia;
  customer?: CustomerProfile;
}

export interface NearbyDistributor {
  id: string;
  businessName: string;
  distanceKm: number | null;
  serviceRadiusKm: number;
  serviceLat?: number | null;
  serviceLng?: number | null;
  city?: string | null;
  productsSummary?: string;
  slotCount?: number;
  goLiveAt?: string | null;
  products?: Product[];
  deliverySlots?: DeliverySlot[];
}

export interface CustomerWithSubscriptions extends CustomerProfile {
  subscriptions?: Subscription[];
  distributorCustomers?: Array<{
    id: string;
    distributorId: string;
    customerId: string;
    onboardedVia: OnboardedVia;
    distributor?: { id: string; businessName: string };
  }>;
}

export interface SchedulePreviewResponse {
  from: string;
  to: string;
  dates: string[];
  pausedDates: string[];
}

export interface NearbyDistributorsResponse {
  page: number;
  pageSize: number;
  items: NearbyDistributor[];
}

export interface DistributorDetail extends DistributorProfile {
  pricing?: Pricing[];
  deliverySlots?: DeliverySlot[];
  products?: Product[];
}

export interface AdminKpis {
  totalDistributors: number;
  totalCustomers: number;
  activeSubscriptions: number;
  pendingVerifications: number;
}

export interface PlatformSettings {
  pauseCutoffHour: number;
  pauseCutoffMinute: number;
  defaultRadiusKm: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  DAILY: "Daily",
  ALTERNATE_DAY: "Alternate day",
  WEEKDAYS: "Weekdays (Mon–Fri)",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const SETUP_STEPS = [
  "business_profile",
  "identity_documents",
  "products",
  "pricing",
  "delivery_slots",
  "readiness",
] as const;

export const SETUP_STEP_LABELS: Record<string, string> = {
  business_profile: "Business profile",
  identity_documents: "Identity documents",
  products: "Products",
  pricing: "Pricing",
  delivery_slots: "Delivery slots",
  readiness: "Go live",
};

export interface DeliveryItem {
  id: string;
  deliveryId: string;
  subscriptionId: string;
  customerId: string;
  productId: string;
  deliveryDate: string;
  plannedQty: number;
  deliveredQty?: number | null;
  status: DeliveryItemStatus;
  routeOrder?: number | null;
  notes?: string | null;
  product?: Product;
  customer?: {
    formattedAddress?: string | null;
    addressLine?: string | null;
    city?: string | null;
    user?: { name: string; phone?: string | null };
  };
  subscription?: { deliverySlot?: DeliverySlot };
}

export interface BillLineItem {
  id: string;
  productId: string;
  deliveryDate: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  product?: Product;
  deliveryItemId?: string | null;
}

export interface Payment {
  id: string;
  amount: string | number;
  method: PaymentMethod;
  reference?: string | null;
  paymentDate: string;
  createdAt: string;
}

export interface BillAdjustment {
  id: string;
  type: BillAdjustmentType;
  amount: string | number;
  reason: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  distributorId: string;
  customerId: string;
  cycleStart: string;
  cycleEnd: string;
  subtotal: string | number;
  adjustments: string | number;
  total: string | number;
  amountPaid: string | number;
  status: BillStatus;
  dueDate?: string | null;
  issuedAt?: string | null;
  isSettlement?: boolean;
  lineItems?: BillLineItem[];
  payments?: Payment[];
  billAdjustments?: BillAdjustment[];
  customer?: {
    user?: { name: string; phone?: string | null };
  };
  distributor?: { businessName: string };
}

export interface SettlementPreview {
  periodStart: string;
  periodEnd: string;
  deliveryCount: number;
  subtotal: number;
  total: number;
  lines: Array<{
    deliveryItemId: string;
    deliveryDate: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface SubscriptionEndRequest {
  id: string;
  subscriptionId: string;
  initiatedBy: "CUSTOMER" | "DISTRIBUTOR";
  reason?: string | null;
  status: RequestStatus;
  customerConfirmedAt?: string | null;
  distributorConfirmedAt?: string | null;
  settlementBillId?: string | null;
  settledAt?: string | null;
  settlementBill?: Bill | null;
  createdAt: string;
}

export interface SubscriptionEndStatus {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    productName: string;
    endedAt?: string | null;
  };
  endRequest: SubscriptionEndRequest | null;
  settlementPreview: SettlementPreview;
}

export interface BillingSettings {
  billingCycle: BillingCycle;
  biWeeklyAnchorDay?: number | null;
  billingDueDays: number;
  timezone: string;
}

export interface DuesEntry {
  customerId: string;
  customerName: string;
  phone?: string | null;
  outstanding: number;
  oldestDue?: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payloadJson?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}
