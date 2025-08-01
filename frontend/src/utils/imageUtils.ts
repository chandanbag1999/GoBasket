/**
 * Image Utilities for GoBasket
 * Handles image optimization, fallbacks, and error handling
 */

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  fit?: 'crop' | 'fill' | 'scale';
}

/**
 * Generate optimized Unsplash image URL
 */
export const getOptimizedImageUrl = (
  imageId: string, 
  options: ImageOptions = {}
): string => {
  const {
    width = 300,
    height = 300,
    quality = 80,
    format = 'webp',
    fit = 'crop'
  } = options;

  return `https://images.unsplash.com/${imageId}?w=${width}&h=${height}&q=${quality}&fm=${format}&fit=${fit}&crop=center`;
};

/**
 * Category image mappings with Unsplash IDs
 */
export const categoryImages = {
  'vegetables-fruits': 'photo-1540420773420-3366772f4999',
  'dairy-breakfast': 'photo-1550583724-b2692b85b150',
  'munchies': 'photo-1621939514649-280e2ee25f60',
  'cold-drinks': 'photo-1544145945-f90425340c7e',
  'instant-food': 'photo-1565299624946-b28f40a0ca4b',
  'tea-coffee': 'photo-1545665225-b23b99e4d45e',
  'bakery-biscuits': 'photo-1509440159596-0249088772ff',
  'sweet-tooth': 'photo-1551024506-0bccd828d307',
  'atta-rice': 'photo-1586201375761-83865001e31c',
  'masala-oil': 'photo-1596040033229-a9821ebd058d',
  'chicken-meat': 'photo-1529692236671-f1f6cf9683ba',
  'paan-corner': 'photo-1599909533730-f9e2b5e0b5e5',
  'organic-premium': 'photo-1542838132-92c53300491e',
  'baby-care': 'photo-1515488042361-ee00e0ddd4e4',
  'pharma-wellness': 'photo-1559757148-5c350d0d3c56',
  'cleaning-household': 'photo-1558618666-fcd25c85cd64',
  'home-office': 'photo-1586023492125-27b2c045efd7',
  'personal-care': 'photo-1556228578-8c89e6adf883',
  'pet-care': 'photo-1601758228041-f3b2795255f1',
  'print-store': 'photo-1586281380349-632531db7ed4'
};

/**
 * Product image mappings with Unsplash IDs
 */
export const productImages = {
  'amul-milk': 'photo-1550583724-b2692b85b150',
  'britannia-bread': 'photo-1509440159596-0249088772ff',
  'tata-salt': 'photo-1596040033229-a9821ebd058d',
  'maggi-noodles': 'photo-1565299624946-b28f40a0ca4b',
  'fresh-apples': 'photo-1560806887-1e4cd0b6cbd6',
  'organic-bananas': 'photo-1571771894821-ce9b6c11b08e',
  'basmati-rice': 'photo-1586201375761-83865001e31c',
  'green-tea': 'photo-1545665225-b23b99e4d45e'
};

/**
 * Get category image URL
 */
export const getCategoryImageUrl = (categoryId: string, options?: ImageOptions): string => {
  const imageId = categoryImages[categoryId as keyof typeof categoryImages];
  if (!imageId) {
    return getOptimizedImageUrl('photo-1540420773420-3366772f4999', options); // Default vegetables image
  }
  return getOptimizedImageUrl(imageId, options);
};

/**
 * Get product image URL
 */
export const getProductImageUrl = (productId: string, options?: ImageOptions): string => {
  const imageId = productImages[productId as keyof typeof productImages];
  if (!imageId) {
    return getOptimizedImageUrl('photo-1540420773420-3366772f4999', options); // Default product image
  }
  return getOptimizedImageUrl(imageId, options);
};

/**
 * Fallback image URLs
 */
export const fallbackImages = {
  category: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEgxMTBWMTMwSDkwVjEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=',
  product: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDE5MCA1MEgxNzBWMTUwSDE3MFYyMDBIMTMwVjE1MEgxMTBWNTBIOTBMMTUwIDEwMFoiIGZpbGw9IiM5QjlCOUIiLz4KPC9zdmc+Cg=='
};

/**
 * Image loading states
 */
export enum ImageLoadingState {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * Image component with error handling
 */
export const createImageWithFallback = (
  src: string,
  alt: string,
  fallbackSrc: string,
  className: string = ''
): HTMLImageElement => {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = className;
  img.loading = 'lazy';
  
  img.onerror = () => {
    img.src = fallbackSrc;
  };
  
  return img;
};

/**
 * Preload critical images
 */
export const preloadImages = (imageUrls: string[]): Promise<void[]> => {
  const promises = imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });
  
  return Promise.all(promises);
};

/**
 * Generate responsive image srcset
 */
export const generateSrcSet = (imageId: string, sizes: number[]): string => {
  return sizes
    .map(size => `${getOptimizedImageUrl(imageId, { width: size, height: size })} ${size}w`)
    .join(', ');
};

/**
 * Check if image URL is valid
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
