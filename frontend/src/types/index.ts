/**
 * Core Type Definitions for GoBasket Quick Commerce Application
 * 
 * This file contains all the essential TypeScript interfaces and types
 * used throughout the application for type safety and better development experience.
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User Interface
 * Represents a user in the system (customer or admin)
 */
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Computed full name for backward compatibility
  phone?: string;
  avatar?: {
    secure_url: string;
  } | string;
  role: 'customer' | 'admin' | 'delivery';
  isVerified: boolean;
  isPhoneVerified?: boolean;
  addresses: Address[];
  preferences: UserPreferences;
  profile?: {
    dateOfBirth?: string;
    gender?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * User Preferences Interface
 * Stores user's app preferences and settings
 */
export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Address Interface
 * Represents delivery addresses
 */
export interface Address {
  _id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  instructions?: string;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

/**
 * Product Interface
 * Represents a product in the catalog
 */
export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  images: string[];
  category: Category;
  subcategory?: Subcategory;
  brand: string;
  sku: string;
  barcode?: string;
  price: {
    original: number;
    selling: number;
    discount?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
  };
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    inStock: boolean;
  };
  specifications: ProductSpecification[];
  variants?: ProductVariant[];
  ratings: {
    average: number;
    count: number;
  };
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  deliveryInfo: {
    estimatedTime: string; // e.g., "10-15 mins"
    freeDelivery: boolean;
    deliveryCharge?: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Product Specification Interface
 * Represents product specifications (weight, dimensions, etc.)
 */
export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
}

/**
 * Product Variant Interface
 * Represents product variants (size, color, etc.)
 */
export interface ProductVariant {
  _id: string;
  name: string;
  value: string;
  price?: number;
  inventory?: number;
  sku?: string;
}

/**
 * Category Interface
 * Represents product categories
 */
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

/**
 * Subcategory Interface
 * Represents product subcategories
 */
export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  image?: string;
  isActive: boolean;
  productCount: number;
}

// ============================================================================
// CART TYPES
// ============================================================================

/**
 * Cart Item Interface
 * Represents an item in the shopping cart
 */
export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  addedAt: string;
  notes?: string;
}

/**
 * Cart Interface
 * Represents the shopping cart
 */
export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totals: CartTotals;
  appliedCoupons: AppliedCoupon[];
  estimatedDelivery: string;
  updatedAt: string;
}

/**
 * Cart Totals Interface
 * Represents cart calculation totals
 */
export interface CartTotals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  savings: number;
}

/**
 * Applied Coupon Interface
 * Represents applied coupon in cart
 */
export interface AppliedCoupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  description: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

/**
 * Order Status Enum
 * Represents possible order statuses
 */
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/**
 * Payment Status Enum
 * Represents possible payment statuses
 */
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/**
 * Order Interface
 * Represents a customer order
 */
export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totals: CartTotals;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  deliveryInfo: DeliveryInfo;
  timeline: OrderTimeline[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order Item Interface
 * Represents an item in an order
 */
export interface OrderItem {
  _id: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  price: number;
  total: number;
}

/**
 * Payment Method Interface
 * Represents payment method information
 */
export interface PaymentMethod {
  type: 'card' | 'upi' | 'wallet' | 'cod' | 'netbanking';
  provider?: string;
  last4?: string;
  transactionId?: string;
}

/**
 * Delivery Info Interface
 * Represents delivery information
 */
export interface DeliveryInfo {
  estimatedTime: string;
  actualTime?: string;
  deliveryPartner?: string;
  trackingId?: string;
  instructions?: string;
}

/**
 * Order Timeline Interface
 * Represents order status timeline
 */
export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  message: string;
  location?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API Response Interface
 * Standard response format for all API calls
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Pagination Interface
 * For paginated API responses
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Search Filters Interface
 * For product search and filtering
 */
export interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Login Form Data Interface
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register Form Data Interface
 */
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

/**
 * Address Form Data Interface
 */
export interface AddressFormData {
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  instructions?: string;
  isDefault?: boolean;
}

/**
 * Profile Update Form Data Interface
 */
export interface ProfileUpdateFormData {
  name: string;
  phone: string;
  dateOfBirth?: Date | string;
  gender?: string;
}

/**
 * Update Profile Data Interface
 */
export interface UpdateProfileData {
  name: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
}

/**
 * Paginated Response Interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Loading State Type
 * For managing loading states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Theme Type
 * For theme management
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Device Type
 * For responsive design
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Notification Type
 * For notification system
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default {};
