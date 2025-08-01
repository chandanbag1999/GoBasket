/**
 * Performance Optimization Utilities
 * 
 * Collection of utilities for optimizing app performance:
 * - Image lazy loading
 * - Component lazy loading
 * - Bundle analysis
 * - Memory management
 * - Performance monitoring
 */

// Image lazy loading with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private images: Set<HTMLImageElement> = new Set();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );
  }

  observe(img: HTMLImageElement) {
    this.images.add(img);
    this.observer.observe(img);
  }

  unobserve(img: HTMLImageElement) {
    this.images.delete(img);
    this.observer.unobserve(img);
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      this.observer.unobserve(img);
    }
  }

  disconnect() {
    this.observer.disconnect();
    this.images.clear();
  }
}

// Global lazy image loader instance
export const lazyImageLoader = new LazyImageLoader();

// Image optimization utilities
export const imageUtils = {
  // Generate responsive image URLs
  getResponsiveImageUrl: (baseUrl: string, width: number, quality = 80) => {
    if (baseUrl.includes('unsplash.com')) {
      return `${baseUrl}?w=${width}&q=${quality}&auto=format`;
    }
    return baseUrl;
  },

  // Generate srcSet for responsive images
  generateSrcSet: (baseUrl: string, sizes: number[] = [320, 640, 960, 1280]) => {
    return sizes
      .map(size => `${imageUtils.getResponsiveImageUrl(baseUrl, size)} ${size}w`)
      .join(', ');
  },

  // Preload critical images
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Convert image to WebP if supported
  getOptimizedImageUrl: (url: string, width?: number) => {
    const supportsWebP = (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })();

    if (supportsWebP && url.includes('unsplash.com')) {
      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      params.set('fm', 'webp');
      params.set('q', '80');
      return `${url}?${params.toString()}`;
    }

    return width ? imageUtils.getResponsiveImageUrl(url, width) : url;
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.set('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.set('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  // Measure custom performance metrics
  mark(name: string) {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    this.metrics.set(name, measure.duration);
    
    return measure.duration;
  }

  // Get all metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Send metrics to analytics
  sendMetrics() {
    const metrics = this.getMetrics();
    
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      Object.entries(metrics).forEach(([name, value]) => {
        gtag('event', 'performance_metric', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(value)
        });
      });
    }

    // Send to custom analytics endpoint
    if (navigator.sendBeacon) {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      navigator.sendBeacon(`${baseURL}/analytics/performance`, JSON.stringify(metrics));
    }
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Memory management utilities
export const memoryUtils = {
  // Get memory usage info
  getMemoryInfo: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  },

  // Monitor memory usage
  monitorMemory: (callback: (info: any) => void, interval = 5000) => {
    const monitor = setInterval(() => {
      const info = memoryUtils.getMemoryInfo();
      if (info) callback(info);
    }, interval);

    return () => clearInterval(monitor);
  },

  // Clean up unused resources
  cleanup: () => {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear performance entries
    performance.clearMarks();
    performance.clearMeasures();
  }
};

// Bundle analysis utilities
export const bundleUtils = {
  // Analyze chunk loading performance
  analyzeChunkLoading: () => {
    const navigationEntries = performance.getEntriesByType('navigation');
    const resourceEntries = performance.getEntriesByType('resource');
    
    const jsChunks = resourceEntries.filter(entry => 
      entry.name.includes('.js') && entry.name.includes('chunk')
    );

    return {
      totalChunks: jsChunks.length,
      averageLoadTime: jsChunks.reduce((sum, chunk) => sum + chunk.duration, 0) / jsChunks.length,
      slowestChunk: jsChunks.reduce((slowest, chunk) => 
        chunk.duration > slowest.duration ? chunk : slowest
      ),
      chunkDetails: jsChunks.map(chunk => ({
        name: chunk.name,
        size: chunk.transferSize,
        loadTime: chunk.duration
      }))
    };
  },

  // Get bundle size information (disabled - endpoint not available)
  getBundleInfo: async () => {
    try {
      // const response = await fetch('/api/bundle-info');
      // return await response.json();
      console.warn('Bundle info endpoint disabled');
      return null;
    } catch (error) {
      console.warn('Bundle info not available:', error);
      return null;
    }
  }
};

// Network performance utilities
export const networkUtils = {
  // Get connection information
  getConnectionInfo: () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  },

  // Adapt quality based on connection
  getOptimalImageQuality: () => {
    const connection = networkUtils.getConnectionInfo();
    if (!connection) return 80;

    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 40;
      case '3g':
        return 60;
      case '4g':
      default:
        return 80;
    }
  },

  // Check if user prefers reduced data
  shouldReduceData: () => {
    const connection = networkUtils.getConnectionInfo();
    return connection?.saveData || false;
  }
};

// Performance optimization hooks
export const performanceHooks = {
  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize expensive calculations
  memoize: <T extends (...args: any[]) => any>(func: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Mark app start
  performanceMonitor.mark('app-start');

  // Monitor page load
  window.addEventListener('load', () => {
    performanceMonitor.mark('app-loaded');
    performanceMonitor.measure('app-load-time', 'app-start', 'app-loaded');
    
    // Send metrics after a delay to capture all measurements
    setTimeout(() => {
      performanceMonitor.sendMetrics();
    }, 5000);
  });

  // Monitor memory usage in development
  if (process.env.NODE_ENV === 'development') {
    memoryUtils.monitorMemory((info) => {
      if (info.usagePercentage > 80) {
        console.warn('High memory usage detected:', info);
      }
    });
  }
};

export default {
  lazyImageLoader,
  imageUtils,
  performanceMonitor,
  memoryUtils,
  bundleUtils,
  networkUtils,
  performanceHooks,
  initializePerformanceMonitoring
};
