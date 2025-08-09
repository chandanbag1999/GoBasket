// User Types
export interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  role: 'customer' | 'admin'
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Product Types
export interface Product {
  _id: string
  name: string
  description: string
  price: number
  costPrice: number
  stock: number
  category: Category
  subcategory?: Category
  images: string[]
  brand?: string
  unit: string
  weight?: number
  tags: string[]
  isActive: boolean
  isFeatured: boolean
  ratings: {
    average: number
    count: number
  }
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
}

// Cart Types
export interface CartItem {
  productId: string
  product: Product
  quantity: number
  price: number
  subtotal: number
}

export interface Cart {
  _id: string
  userId: string
  items: CartItem[]
  totalItems: number
  totalAmount: number
  lastModified: string
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error'
  message: string
  data: T
}

// Common Types
export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}
