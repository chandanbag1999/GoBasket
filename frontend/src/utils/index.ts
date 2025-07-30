import { STORAGE_KEYS, VALIDATION } from '@/constants';
import type { ApiResponse } from '@/types';

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency value to Indian Rupees
 * @param amount - Amount to format
 * @param showSymbol - Whether to show currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? formatted : formatted.replace('₹', '').trim();
};

/**
 * Format number with Indian numbering system (lakhs, crores)
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format date to readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', options).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email address
 * @param email - Email to validate
 * @returns Boolean indicating validity
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validate Indian phone number
 * @param phone - Phone number to validate
 * @returns Boolean indicating validity
 */
export const isValidPhone = (phone: string): boolean => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and strength score
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`);
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
};

/**
 * Validate Indian PIN code
 * @param pincode - PIN code to validate
 * @returns Boolean indicating validity
 */
export const isValidPincode = (pincode: string): boolean => {
  return VALIDATION.PINCODE_REGEX.test(pincode);
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Get item from localStorage with error handling
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value or default value
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage with error handling
 * @param key - Storage key
 * @param value - Value to store
 * @returns Boolean indicating success
 */
export const setStorageItem = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param key - Storage key
 * @returns Boolean indicating success
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all app-related items from localStorage
 */
export const clearAppStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key);
  });
};

// ============================================================================
// URL AND ROUTING UTILITIES
// ============================================================================

/**
 * Generate product URL slug from name
 * @param name - Product name
 * @returns URL-friendly slug
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Build query string from object
 * @param params - Parameters object
 * @returns Query string
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Parse query string to object
 * @param queryString - Query string to parse
 * @returns Parameters object
 */
export const parseQueryString = (queryString: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(queryString);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
};

// ============================================================================
// ARRAY AND OBJECT UTILITIES
// ============================================================================

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to limit function calls
 * @param func - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    Object.keys(obj).forEach(key => {
      (clonedObj as any)[key] = deepClone((obj as any)[key]);
    });
    return clonedObj;
  }
  return obj;
};

/**
 * Check if object is empty
 * @param obj - Object to check
 * @returns Boolean indicating if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// ============================================================================
// API UTILITIES
// ============================================================================

/**
 * Handle API response and extract data
 * @param response - API response
 * @returns Extracted data or throws error
 */
export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'API request failed');
};

/**
 * Create error object from API response
 * @param response - API response
 * @returns Error object
 */
export const createApiError = (response: ApiResponse): Error => {
  const message = response.error || 'An unexpected error occurred';
  const error = new Error(message);
  (error as any).response = response;
  return error;
};

// ============================================================================
// DEVICE AND BROWSER UTILITIES
// ============================================================================

/**
 * Check if device is mobile
 * @returns Boolean indicating if device is mobile
 */
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

/**
 * Check if device is tablet
 * @returns Boolean indicating if device is tablet
 */
export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

/**
 * Check if device is desktop
 * @returns Boolean indicating if device is desktop
 */
export const isDesktop = (): boolean => {
  return window.innerWidth >= 1024;
};

/**
 * Get device type
 * @returns Device type string
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise indicating success
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Formatting
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  truncateText,
  
  // Validation
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidPincode,
  
  // Storage
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearAppStorage,
  
  // URL
  generateSlug,
  buildQueryString,
  parseQueryString,
  
  // Utilities
  debounce,
  throttle,
  deepClone,
  isEmpty,
  
  // API
  handleApiResponse,
  createApiError,
  
  // Device
  isMobile,
  isTablet,
  isDesktop,
  getDeviceType,
  copyToClipboard
};
