/**
 * Mock API Service
 * Simulates backend API responses for development and testing
 */

// Mock data
const mockUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'customer',
    addresses: [
      {
        id: 'addr-1',
        type: 'home',
        name: 'John Doe',
        phone: '+91 98765 43210',
        addressLine1: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        isDefault: true,
      }
    ]
  }
];

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Fresh Red Apples',
    description: 'Premium quality red apples from Kashmir',
    price: 120,
    originalPrice: 150,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300',
    category: 'fruits',
    inStock: true,
    rating: 4.5,
    reviewCount: 128,
    unit: 'kg',
    minQuantity: 0.5,
    maxQuantity: 10,
  },
  {
    id: 'prod-2',
    name: 'Organic Bananas',
    description: 'Fresh organic bananas rich in potassium',
    price: 60,
    originalPrice: 80,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300',
    category: 'fruits',
    inStock: true,
    rating: 4.3,
    reviewCount: 89,
    unit: 'dozen',
    minQuantity: 1,
    maxQuantity: 5,
  },
  {
    id: 'prod-3',
    name: 'Fresh Milk',
    description: 'Pure cow milk, rich in calcium and protein',
    price: 65,
    originalPrice: 70,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
    category: 'dairy',
    inStock: true,
    rating: 4.7,
    reviewCount: 256,
    unit: 'liter',
    minQuantity: 1,
    maxQuantity: 10,
  },
  {
    id: 'prod-4',
    name: 'Whole Wheat Bread',
    description: 'Freshly baked whole wheat bread',
    price: 45,
    originalPrice: 50,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
    category: 'bakery',
    inStock: true,
    rating: 4.2,
    reviewCount: 67,
    unit: 'piece',
    minQuantity: 1,
    maxQuantity: 5,
  },
  {
    id: 'prod-5',
    name: 'Basmati Rice',
    description: 'Premium quality basmati rice',
    price: 180,
    originalPrice: 200,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
    category: 'grains',
    inStock: true,
    rating: 4.6,
    reviewCount: 145,
    unit: 'kg',
    minQuantity: 1,
    maxQuantity: 25,
  },
];

const mockCategories = [
  { id: 'fruits', name: 'Fruits & Vegetables', icon: '🍎', color: '#10b981' },
  { id: 'dairy', name: 'Dairy & Eggs', icon: '🥛', color: '#3b82f6' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', color: '#f59e0b' },
  { id: 'grains', name: 'Grains & Rice', icon: '🌾', color: '#8b5cf6' },
  { id: 'snacks', name: 'Snacks', icon: '🍿', color: '#ef4444' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', color: '#06b6d4' },
];

const mockOrders = [
  {
    id: 'order-1',
    status: 'delivered',
    total: 450,
    items: 3,
    date: '2024-01-20T10:30:00Z',
    deliveryAddress: '123 MG Road, Bangalore',
    items: [
      { ...mockProducts[0], quantity: 2 },
      { ...mockProducts[1], quantity: 1 },
    ]
  },
  {
    id: 'order-2',
    status: 'in-transit',
    total: 285,
    items: 2,
    date: '2024-01-22T14:15:00Z',
    deliveryAddress: '123 MG Road, Bangalore',
    items: [
      { ...mockProducts[2], quantity: 3 },
      { ...mockProducts[3], quantity: 2 },
    ]
  },
];

let mockCart = {
  id: 'cart-1',
  items: [
    { ...mockProducts[0], quantity: 1, id: 'cart-item-1' },
    { ...mockProducts[1], quantity: 2, id: 'cart-item-2' },
  ],
  total: 240,
  subtotal: 240,
  discount: 0,
  deliveryFee: 0,
};

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createResponse = <T>(data: T, success = true, message = 'Success') => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString(),
});

const createPaginatedResponse = <T>(
  data: T[],
  page = 1,
  limit = 10,
  total = data.length
) => ({
  success: true,
  data,
  message: 'Success',
  timestamp: new Date().toISOString(),
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});

// Mock API Service
export class MockAPIService {
  private isEnabled = import.meta.env.VITE_MOCK_API === 'true';

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    await delay(1000);
    
    if (credentials.email === 'john@example.com' && credentials.password === 'password') {
      const user = mockUsers[0];
      const token = 'mock-jwt-token-' + Date.now();
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return createResponse({
        user,
        token,
      });
    }
    
    throw new Error('Invalid credentials');
  }

  async register(userData: any) {
    await delay(1500);
    
    const newUser = {
      id: 'user-' + Date.now(),
      ...userData,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'customer',
      addresses: [],
    };
    
    mockUsers.push(newUser);
    
    return createResponse({
      user: newUser,
      message: 'Registration successful',
    });
  }

  async getProfile() {
    await delay(500);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return createResponse(user);
  }

  // Products endpoints
  async getProducts(params: any = {}) {
    await delay(800);
    
    let filteredProducts = [...mockProducts];
    
    // Apply filters
    if (params.category) {
      filteredProducts = filteredProducts.filter(p => p.category === params.category);
    }
    
    if (params.search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(params.search.toLowerCase()) ||
        p.description.toLowerCase().includes(params.search.toLowerCase())
      );
    }
    
    // Apply sorting
    if (params.sortBy === 'price') {
      filteredProducts.sort((a, b) => 
        params.sortOrder === 'desc' ? b.price - a.price : a.price - b.price
      );
    }
    
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 12;
    const start = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(start, start + limit);
    
    return createPaginatedResponse(paginatedProducts, page, limit, filteredProducts.length);
  }

  async getProduct(id: string) {
    await delay(500);
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return createResponse(product);
  }

  async getCategories() {
    await delay(300);
    return createResponse(mockCategories);
  }

  async getFeaturedProducts() {
    await delay(600);
    return createResponse(mockProducts.slice(0, 4));
  }

  async searchProducts(query: string) {
    await delay(700);
    const results = mockProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
    );
    return createResponse(results);
  }

  // Cart endpoints
  async getCart() {
    await delay(400);
    return createResponse(mockCart);
  }

  async addToCart(productId: string, quantity: number) {
    await delay(600);
    
    const product = mockProducts.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const existingItem = mockCart.items.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      mockCart.items.push({
        ...product,
        quantity,
        id: 'cart-item-' + Date.now(),
      });
    }
    
    // Recalculate totals
    mockCart.subtotal = mockCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    mockCart.total = mockCart.subtotal + mockCart.deliveryFee - mockCart.discount;
    
    return createResponse(mockCart);
  }

  async updateCartItem(itemId: string, quantity: number) {
    await delay(500);
    
    const item = mockCart.items.find(item => item.id === itemId);
    if (!item) {
      throw new Error('Cart item not found');
    }
    
    if (quantity <= 0) {
      mockCart.items = mockCart.items.filter(item => item.id !== itemId);
    } else {
      item.quantity = quantity;
    }
    
    // Recalculate totals
    mockCart.subtotal = mockCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    mockCart.total = mockCart.subtotal + mockCart.deliveryFee - mockCart.discount;
    
    return createResponse(mockCart);
  }

  async removeFromCart(itemId: string) {
    await delay(400);
    
    mockCart.items = mockCart.items.filter(item => item.id !== itemId);
    
    // Recalculate totals
    mockCart.subtotal = mockCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    mockCart.total = mockCart.subtotal + mockCart.deliveryFee - mockCart.discount;
    
    return createResponse(mockCart);
  }

  async clearCart() {
    await delay(300);
    
    mockCart.items = [];
    mockCart.subtotal = 0;
    mockCart.total = 0;
    mockCart.discount = 0;
    
    return createResponse(mockCart);
  }

  // Orders endpoints
  async getOrders(params: any = {}) {
    await delay(800);
    
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    
    return createPaginatedResponse(mockOrders, page, limit);
  }

  async getOrder(id: string) {
    await delay(500);
    
    const order = mockOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    return createResponse(order);
  }

  async createOrder(orderData: any) {
    await delay(1200);
    
    const newOrder = {
      id: 'order-' + Date.now(),
      status: 'confirmed',
      total: mockCart.total,
      items: mockCart.items.length,
      date: new Date().toISOString(),
      deliveryAddress: orderData.address,
      items: [...mockCart.items],
    };
    
    mockOrders.unshift(newOrder);
    
    // Clear cart after order
    mockCart.items = [];
    mockCart.subtotal = 0;
    mockCart.total = 0;
    
    return createResponse(newOrder);
  }

  // Address endpoints
  async getAddresses() {
    await delay(400);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return createResponse(user.addresses || []);
  }

  async createAddress(addressData: any) {
    await delay(600);
    
    const newAddress = {
      id: 'addr-' + Date.now(),
      ...addressData,
      isDefault: false,
    };
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.addresses = user.addresses || [];
    user.addresses.push(newAddress);
    localStorage.setItem('user', JSON.stringify(user));
    
    return createResponse(newAddress);
  }

  // Check if mock API should be used (disabled - using real backend)
  shouldUseMock(): boolean {
    // Force disable mock API - always use real backend
    return false;
  }
}

export const mockAPIService = new MockAPIService();
