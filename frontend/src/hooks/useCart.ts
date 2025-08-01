import { useState, useCallback } from 'react';

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  restaurantId: string;
  restaurantName: string;
  variants?: Record<string, any>;
}

interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  restaurantId?: string;
  restaurantName?: string;
}

/**
 * Shopping Cart Hook
 * 
 * This hook manages the shopping cart state and provides
 * methods to add, remove, and update cart items.
 * 
 * Features:
 * - Add/remove items
 * - Update quantities
 * - Calculate totals
 * - Restaurant validation (single restaurant per cart)
 * - Persistent storage (localStorage)
 */
export const useCart = () => {
  // Initialize cart from localStorage or empty state
  const [cart, setCart] = useState<Cart>(() => {
    try {
      const savedCart = localStorage.getItem('gobasket-cart');
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    
    return {
      items: [],
      total: 0,
      itemCount: 0,
    };
  });

  // Save cart to localStorage whenever it changes
  const saveCart = useCallback((newCart: Cart) => {
    try {
      localStorage.setItem('gobasket-cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, []);

  // Calculate cart totals
  const calculateTotals = useCallback((items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, itemCount };
  }, []);

  // Add item to cart
  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCart(currentCart => {
      // Check if adding from different restaurant
      if (currentCart.restaurantId && currentCart.restaurantId !== item.restaurantId) {
        // For now, we'll replace the cart. In a real app, you might want to ask the user
        const newItems = [{ ...item, quantity }];
        const { total, itemCount } = calculateTotals(newItems);
        
        const newCart = {
          items: newItems,
          total,
          itemCount,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
        };
        
        saveCart(newCart);
        return newCart;
      }

      // Check if item already exists
      const existingItemIndex = currentCart.items.findIndex(cartItem => cartItem.id === item.id);
      
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = [...currentCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        newItems = [...currentCart.items, { ...item, quantity }];
      }

      const { total, itemCount } = calculateTotals(newItems);
      
      const newCart = {
        items: newItems,
        total,
        itemCount,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
      };
      
      saveCart(newCart);
      return newCart;
    });
  }, [calculateTotals, saveCart]);

  // Remove item from cart
  const removeItem = useCallback((itemId: string) => {
    setCart(currentCart => {
      const newItems = currentCart.items.filter(item => item.id !== itemId);
      const { total, itemCount } = calculateTotals(newItems);
      
      const newCart = {
        items: newItems,
        total,
        itemCount,
        restaurantId: newItems.length > 0 ? currentCart.restaurantId : undefined,
        restaurantName: newItems.length > 0 ? currentCart.restaurantName : undefined,
      };
      
      saveCart(newCart);
      return newCart;
    });
  }, [calculateTotals, saveCart]);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCart(currentCart => {
      const newItems = currentCart.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      const { total, itemCount } = calculateTotals(newItems);
      
      const newCart = {
        items: newItems,
        total,
        itemCount,
        restaurantId: currentCart.restaurantId,
        restaurantName: currentCart.restaurantName,
      };
      
      saveCart(newCart);
      return newCart;
    });
  }, [calculateTotals, removeItem, saveCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    const emptyCart = {
      items: [],
      total: 0,
      itemCount: 0,
    };
    
    saveCart(emptyCart);
  }, [saveCart]);

  // Get item quantity
  const getItemQuantity = useCallback((itemId: string) => {
    const item = cart.items.find(item => item.id === itemId);
    return item?.quantity || 0;
  }, [cart.items]);

  return {
    // State
    cart,
    items: cart.items,
    total: cart.total,
    itemCount: cart.itemCount,
    totalItems: cart.itemCount, // Alias for compatibility
    restaurantId: cart.restaurantId,
    restaurantName: cart.restaurantName,

    // Computed
    isEmpty: cart.items.length === 0,
    isNotEmpty: cart.items.length > 0,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };
};

export default useCart;
