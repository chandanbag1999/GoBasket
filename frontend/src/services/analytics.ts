/**
 * Analytics Service
 * Google Analytics 4, custom tracking, and performance monitoring
 */

// Google Analytics types
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface EcommerceEvent {
  transaction_id: string;
  value: number;
  currency: string;
  items: EcommerceItem[];
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  variant?: string;
  brand?: string;
}

export interface UserProperties {
  user_id?: string;
  customer_type?: 'new' | 'returning';
  preferred_category?: string;
  total_orders?: number;
  lifetime_value?: number;
}

class AnalyticsService {
  private gaId: string;
  private isInitialized: boolean = false;
  private debugMode: boolean = false;
  private customEvents: Map<string, any[]> = new Map();

  constructor() {
    this.gaId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
    this.debugMode = import.meta.env.DEV || false;
    this.initializeGA();
  }

  private async initializeGA(): Promise<void> {
    if (!this.gaId || typeof window === 'undefined') {
      console.warn('[Analytics] Google Analytics ID not provided');
      return;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
      document.head.appendChild(script);

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Configure GA
      window.gtag('js', new Date());
      window.gtag('config', this.gaId, {
        debug_mode: this.debugMode,
        send_page_view: false, // We'll handle page views manually
        anonymize_ip: true,
        allow_google_signals: false,
        cookie_flags: 'SameSite=None;Secure',
      });

      this.isInitialized = true;
      console.log('[Analytics] Google Analytics initialized');

      // Send initial page view
      this.trackPageView();
    } catch (error) {
      console.error('[Analytics] Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView(page_title?: string, page_location?: string): void {
    if (!this.isInitialized) return;

    const params = {
      page_title: page_title || document.title,
      page_location: page_location || window.location.href,
      page_path: window.location.pathname,
    };

    window.gtag('event', 'page_view', params);
    
    if (this.debugMode) {
      console.log('[Analytics] Page view tracked:', params);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized) {
      // Store event for later if GA not ready
      if (!this.customEvents.has('pending')) {
        this.customEvents.set('pending', []);
      }
      this.customEvents.get('pending')!.push(event);
      return;
    }

    const eventParams = {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters,
    };

    window.gtag('event', event.action, eventParams);

    if (this.debugMode) {
      console.log('[Analytics] Event tracked:', event.action, eventParams);
    }
  }

  /**
   * Track ecommerce events
   */
  trackPurchase(data: EcommerceEvent): void {
    if (!this.isInitialized) return;

    window.gtag('event', 'purchase', {
      transaction_id: data.transaction_id,
      value: data.value,
      currency: data.currency,
      items: data.items.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_variant: item.variant,
        item_brand: item.brand,
      })),
    });

    if (this.debugMode) {
      console.log('[Analytics] Purchase tracked:', data);
    }
  }

  trackAddToCart(item: EcommerceItem, value: number): void {
    if (!this.isInitialized) return;

    window.gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: value,
      items: [{
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        item_variant: item.variant,
        item_brand: item.brand,
      }],
    });
  }

  trackRemoveFromCart(item: EcommerceItem, value: number): void {
    if (!this.isInitialized) return;

    window.gtag('event', 'remove_from_cart', {
      currency: 'INR',
      value: value,
      items: [{
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }],
    });
  }

  trackViewItem(item: EcommerceItem): void {
    if (!this.isInitialized) return;

    window.gtag('event', 'view_item', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        price: item.price,
        item_variant: item.variant,
        item_brand: item.brand,
      }],
    });
  }

  trackBeginCheckout(items: EcommerceItem[], value: number): void {
    if (!this.isInitialized) return;

    window.gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: value,
      items: items.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  trackSearch(search_term: string, results_count?: number): void {
    this.trackEvent({
      action: 'search',
      category: 'engagement',
      label: search_term,
      custom_parameters: {
        search_term,
        results_count,
      },
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.isInitialized) return;

    if (properties.user_id) {
      window.gtag('config', this.gaId, {
        user_id: properties.user_id,
      });
    }

    // Set custom user properties
    Object.entries(properties).forEach(([key, value]) => {
      if (key !== 'user_id') {
        window.gtag('set', { [key]: value });
      }
    });

    if (this.debugMode) {
      console.log('[Analytics] User properties set:', properties);
    }
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, details?: Record<string, any>): void {
    this.trackEvent({
      action,
      category: 'engagement',
      custom_parameters: details,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit?: string): void {
    this.trackEvent({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value: Math.round(value),
      custom_parameters: {
        metric_name: metric,
        metric_value: value,
        metric_unit: unit,
      },
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent({
      action: 'exception',
      category: 'error',
      label: error.message,
      custom_parameters: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        error_context: context,
        fatal: false,
      },
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversion_type: string, value?: number): void {
    this.trackEvent({
      action: 'conversion',
      category: 'conversion',
      label: conversion_type,
      value,
      custom_parameters: {
        conversion_type,
      },
    });
  }

  /**
   * Custom dimension tracking
   */
  setCustomDimension(index: number, value: string): void {
    if (!this.isInitialized) return;

    window.gtag('config', this.gaId, {
      [`custom_map.dimension${index}`]: value,
    });
  }

  /**
   * Send custom metrics
   */
  sendCustomMetric(name: string, value: number): void {
    if (!this.isInitialized) return;

    window.gtag('event', 'custom_metric', {
      metric_name: name,
      metric_value: value,
    });
  }

  /**
   * Flush pending events
   */
  private flushPendingEvents(): void {
    const pendingEvents = this.customEvents.get('pending');
    if (pendingEvents && pendingEvents.length > 0) {
      pendingEvents.forEach(event => this.trackEvent(event));
      this.customEvents.delete('pending');
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (this.isInitialized) {
      window.gtag('config', this.gaId, {
        debug_mode: enabled,
      });
    }
  }

  /**
   * Get analytics status
   */
  getStatus(): { initialized: boolean; debugMode: boolean; gaId: string } {
    return {
      initialized: this.isInitialized,
      debugMode: this.debugMode,
      gaId: this.gaId,
    };
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// React hook for analytics
export const useAnalytics = () => {
  const trackPageView = (title?: string, location?: string) => {
    analyticsService.trackPageView(title, location);
  };

  const trackEvent = (event: AnalyticsEvent) => {
    analyticsService.trackEvent(event);
  };

  const trackPurchase = (data: EcommerceEvent) => {
    analyticsService.trackPurchase(data);
  };

  const trackAddToCart = (item: EcommerceItem, value: number) => {
    analyticsService.trackAddToCart(item, value);
  };

  const trackSearch = (term: string, resultsCount?: number) => {
    analyticsService.trackSearch(term, resultsCount);
  };

  const setUserProperties = (properties: UserProperties) => {
    analyticsService.setUserProperties(properties);
  };

  return {
    trackPageView,
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart: analyticsService.trackRemoveFromCart.bind(analyticsService),
    trackViewItem: analyticsService.trackViewItem.bind(analyticsService),
    trackBeginCheckout: analyticsService.trackBeginCheckout.bind(analyticsService),
    trackSearch,
    trackEngagement: analyticsService.trackEngagement.bind(analyticsService),
    trackPerformance: analyticsService.trackPerformance.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackConversion: analyticsService.trackConversion.bind(analyticsService),
    setUserProperties,
    status: analyticsService.getStatus(),
  };
};

export default analyticsService;
