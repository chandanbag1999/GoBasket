// Simple Express Server for GoBasket - Professional Grade
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GoBasket Backend Server is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API v1 info
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'GoBasket API v1 - Professional Grade',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth/*',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      payments: '/api/v1/payments/*',
      analytics: '/api/v1/analytics/*'
    },
    features: {
      authentication: 'JWT-based',
      payments: 'Razorpay integration',
      realtime: 'Socket.io support',
      security: 'CORS & validation enabled'
    }
  });
});

// Mock data
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
    deliveryTime: '15 mins'
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
    deliveryTime: '15 mins'
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
    deliveryTime: '15 mins'
  },
  {
    id: 'prod-4',
    name: 'Whole Wheat Bread',
    description: 'Fresh baked whole wheat bread',
    price: 45,
    originalPrice: 50,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
    category: 'bakery',
    inStock: true,
    rating: 4.4,
    reviewCount: 67,
    unit: 'loaf',
    deliveryTime: '15 mins'
  }
];

const mockCategories = [
  { 
    id: 'fruits', 
    name: 'Fruits & Vegetables', 
    icon: '🍎', 
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200',
    productCount: 150
  },
  { 
    id: 'dairy', 
    name: 'Dairy & Eggs', 
    icon: '🥛', 
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200',
    productCount: 85
  },
  { 
    id: 'bakery', 
    name: 'Bakery', 
    icon: '🍞', 
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
    productCount: 45
  },
  { 
    id: 'grains', 
    name: 'Grains & Rice', 
    icon: '🌾', 
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200',
    productCount: 120
  }
];

// Auth Routes
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: email,
        phone: '+91 98765 43210',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
      },
      tokens: {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now()
      }
    }
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Name, email and password are required'
    });
  }
  
  res.json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: 'user-' + Date.now(),
        name: name,
        email: email,
        phone: phone || '',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
      },
      tokens: {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now()
      }
    }
  });
});

// Products Routes
app.get('/api/v1/products', (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  let filteredProducts = [...mockProducts];
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: filteredProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit)
    }
  });
});

app.get('/api/v1/products/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

// Categories Routes
app.get('/api/v1/categories', (req, res) => {
  res.json({
    success: true,
    data: mockCategories
  });
});

// Cart Routes
app.get('/api/v1/cart', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'cart-1',
      items: [],
      total: 0,
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      itemCount: 0
    }
  });
});

app.post('/api/v1/cart/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  res.json({
    success: true,
    message: 'Item added to cart',
    data: {
      productId,
      quantity,
      addedAt: new Date().toISOString()
    }
  });
});

// Analytics Routes
app.post('/api/v1/analytics/performance', (req, res) => {
  console.log('[Analytics] Performance metrics received:', req.body);
  
  res.json({
    success: true,
    message: 'Performance metrics logged successfully'
  });
});

app.get('/api/v1/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalOrders: 3420,
      totalRevenue: 125000,
      activeOrders: 45,
      topProducts: mockProducts.slice(0, 3),
      recentOrders: []
    }
  });
});

// Payment Routes
app.post('/api/v1/payments/create-order', (req, res) => {
  const { amount, currency, receipt } = req.body;
  
  res.json({
    success: true,
    data: {
      id: 'order_' + Date.now(),
      amount: amount,
      currency: currency || 'INR',
      receipt: receipt,
      status: 'created',
      created_at: new Date().toISOString()
    }
  });
});

app.post('/api/v1/payments/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      status: 'verified',
      verified_at: new Date().toISOString()
    }
  });
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/health',
      '/api/v1',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/products',
      '/api/v1/categories',
      '/api/v1/cart',
      '/api/v1/analytics/*',
      '/api/v1/payments/*'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GoBasket Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API v1: http://localhost:${PORT}/api/v1`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
  console.log(`💳 Razorpay Key: ${process.env.RAZORPAY_KEY_ID}`);
});

module.exports = app;
