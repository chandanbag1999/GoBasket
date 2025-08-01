
export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Product Routes
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CATEGORY: '/category/:slug',
  CATEGORIES: '/categories',
  SEARCH: '/search',
  
  // User Routes
  PROFILE: '/profile',
  ADDRESSES: '/profile/addresses',
  ORDERS: '/profile/orders',
  ORDER_DETAIL: '/profile/orders/:id',
  WISHLIST: '/profile/wishlist',
  SETTINGS: '/profile/settings',
  
  // Cart & Checkout
  CART: '/cart',
  CHECKOUT: '/checkout',
  PAYMENT: '/payment',
  ORDER_SUCCESS: '/order-success',
  
  // Admin Routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_USERS: '/admin/users',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ANALYTICS: '/admin/analytics',
  
  // Other Routes
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  FAQ: '/faq',
  SUPPORT: '/support'
} as const;


export const STORAGE_KEYS = {
  // Authentication
  ACCESS_TOKEN: 'gobasket_access_token',
  REFRESH_TOKEN: 'gobasket_refresh_token',
  USER_DATA: 'gobasket_user_data',
  
  // Cart & Preferences
  CART_DATA: 'gobasket_cart',
  WISHLIST_DATA: 'gobasket_wishlist',
  RECENT_SEARCHES: 'gobasket_recent_searches',
  USER_PREFERENCES: 'gobasket_preferences',
  
  // App State
  THEME: 'gobasket_theme',
  LANGUAGE: 'gobasket_language',
  SELECTED_ADDRESS: 'gobasket_selected_address',
  ONBOARDING_COMPLETED: 'gobasket_onboarding_completed'
} as const;


export const BUSINESS_RULES = {
  // Order Limits
  MIN_ORDER_VALUE: 99, // Minimum order value in rupees
  MAX_ORDER_VALUE: 10000, // Maximum order value in rupees
  FREE_DELIVERY_THRESHOLD: 299, // Free delivery above this amount
  
  // Cart Limits
  MAX_CART_ITEMS: 50, // Maximum items in cart
  MAX_ITEM_QUANTITY: 10, // Maximum quantity per item
  
  // Delivery
  STANDARD_DELIVERY_FEE: 29, // Standard delivery fee
  EXPRESS_DELIVERY_FEE: 49, // Express delivery fee
  DELIVERY_TIME_SLOTS: [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM',
    '7:00 PM - 9:00 PM'
  ],
  
  // User Limits
  MAX_ADDRESSES: 5, // Maximum saved addresses per user
  MAX_WISHLIST_ITEMS: 100, // Maximum wishlist items
  
  // Search & Pagination
  PRODUCTS_PER_PAGE: 20,
  SEARCH_RESULTS_PER_PAGE: 24,
  MAX_SEARCH_HISTORY: 10,
  
  // Ratings & Reviews
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_REVIEW_LENGTH: 500
} as const;


export const COLORS = {
  // Primary Colors (Orange - Main brand color)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  
  // Secondary Colors (Green - Success, delivery, etc.)
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },
  
  // Status Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
} as const;


export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 seconds
  
  // API Endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    
    // User
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    ADDRESSES: '/user/addresses',
    ORDERS: '/user/orders',
    WISHLIST: '/user/wishlist',
    
    // Products
    PRODUCTS: '/products',
    CATEGORIES: '/categories',
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
    TRENDING: '/products/trending',
    
    // Cart
    CART: '/cart',
    ADD_TO_CART: '/cart/add',
    UPDATE_CART: '/cart/update',
    REMOVE_FROM_CART: '/cart/remove',
    CLEAR_CART: '/cart/clear',
    
    // Orders
    CREATE_ORDER: '/orders',
    ORDER_HISTORY: '/orders/history',
    ORDER_DETAILS: '/orders/:id',
    CANCEL_ORDER: '/orders/:id/cancel',
    
    // Payments
    CREATE_PAYMENT: '/payments/create',
    VERIFY_PAYMENT: '/payments/verify',
    PAYMENT_METHODS: '/payments/methods',
    
    // Admin
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_PRODUCTS: '/admin/products',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_USERS: '/admin/users'
  }
} as const;


export const APP_CONFIG = {
  // App Info
  APP_NAME: 'GoBasket',
  name: 'GoBasket', // Alias for compatibility
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Quick Commerce Grocery Delivery App',

  // Contact Information
  contact: {
    phone: '+91 98765 43210',
    email: 'support@gobasket.com',
    address: 'Mumbai, Maharashtra, India'
  },
  
  // Feature Flags
  FEATURES: {
    DARK_MODE: true,
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: false,
    ANALYTICS: true,
    CHAT_SUPPORT: true,
    VOICE_SEARCH: false,
    AR_FEATURES: false
  },
  
  // Performance
  IMAGE_LAZY_LOADING: true,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY: 300, // 300ms for search
  
  // UI Settings
  ANIMATION_DURATION: 200, // Default animation duration in ms
  TOAST_DURATION: 4000, // Toast notification duration
  MODAL_ANIMATION_DURATION: 150,
  
  // Responsive Breakpoints (matching Tailwind CSS)
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
} as const;


export const VALIDATION = {
  // Email
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone (Indian format)
  PHONE_REGEX: /^[6-9]\d{9}$/,
  
  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Name
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  NAME_REGEX: /^[a-zA-Z\s]+$/,
  
  // PIN Code (Indian)
  PINCODE_REGEX: /^[1-9][0-9]{5}$/,
  
  // Product
  PRODUCT_NAME_MAX_LENGTH: 100,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
  
  // Review
  REVIEW_MIN_LENGTH: 10,
  REVIEW_MAX_LENGTH: 500
} as const;


export const ERROR_MESSAGES = {
  // Network
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address.',
  TOKEN_EXPIRED: 'Session expired. Please login again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  
  // Validation
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  
  // Cart
  CART_EMPTY: 'Your cart is empty.',
  ITEM_OUT_OF_STOCK: 'This item is currently out of stock.',
  QUANTITY_EXCEEDED: 'Maximum quantity limit exceeded.',
  
  // Orders
  ORDER_NOT_FOUND: 'Order not found.',
  CANNOT_CANCEL_ORDER: 'This order cannot be cancelled.',
  
  // General
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  PAGE_NOT_FOUND: 'Page not found.',
  ACCESS_DENIED: 'Access denied.'
} as const;


export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully.',
  
  // Profile
  PROFILE_UPDATED: 'Profile updated successfully.',
  ADDRESS_ADDED: 'Address added successfully.',
  ADDRESS_UPDATED: 'Address updated successfully.',
  ADDRESS_DELETED: 'Address deleted successfully.',
  
  // Cart
  ITEM_ADDED_TO_CART: 'Item added to cart.',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart.',
  CART_UPDATED: 'Cart updated successfully.',
  
  // Orders
  ORDER_PLACED: 'Order placed successfully!',
  ORDER_CANCELLED: 'Order cancelled successfully.',
  
  // General
  CHANGES_SAVED: 'Changes saved successfully.',
  ITEM_SAVED: 'Item saved successfully.',
  ITEM_DELETED: 'Item deleted successfully.'
} as const;

export default {
  ROUTES,
  STORAGE_KEYS,
  BUSINESS_RULES,
  COLORS,
  API_CONFIG,
  APP_CONFIG,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
