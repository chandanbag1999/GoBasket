import React, { Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout Components
import { AppLayout, AuthLayout } from '@/components/layout';

// Page Components - Lazy loaded for better performance
const HomePage = React.lazy(() => import('@/pages/home/HomePage'));
const BlinkitHomePage = React.lazy(() => import('@/pages/home/BlinkitHomePage'));
const BlinkitMobileHomePage = React.lazy(() => import('@/pages/blinkit/BlinkitHomePage'));
const AppHomePage = React.lazy(() => import('@/pages/home/AppHomePage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const OTPVerificationPage = React.lazy(() => import('@/pages/auth/OTPVerificationPage'));
const SearchPage = React.lazy(() => import('@/pages/search/SearchPage'));
const ProductDetailPage = React.lazy(() => import('@/pages/product/ProductDetailPage'));
const CartPage = React.lazy(() => import('@/pages/cart/CartPage'));
const CheckoutPage = React.lazy(() => import('@/pages/checkout/CheckoutPage'));
const OrderSuccessPage = React.lazy(() => import('@/pages/order/OrderSuccessPage'));
const UserDashboard = React.lazy(() => import('@/pages/profile/UserDashboard'));
const OrderHistoryPage = React.lazy(() => import('@/pages/orders/OrderHistoryPage'));
const OrderTrackingPage = React.lazy(() => import('@/pages/orders/OrderTrackingPage'));
const AddressManagementPage = React.lazy(() => import('@/pages/profile/AddressManagementPage'));
const SettingsPage = React.lazy(() => import('@/pages/profile/SettingsPage'));

// Loading component for lazy loaded routes
import { PageLoading } from '@/components/ui/Loading';
import { Button } from '@/components/ui';

// Route protection component
import ProtectedRoute from './ProtectedRoute';

// Constants
import { ROUTES } from '@/constants';

/**
 * Animated Route Wrapper
 * Provides smooth transitions between pages
 */
const AnimatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnimatePresence mode="wait">
    <Suspense fallback={<PageLoading text="Loading page..." />}>
      {children}
    </Suspense>
  </AnimatePresence>
);

/**
 * Router Configuration
 * Defines all application routes with proper nesting and protection
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <AnimatedRoute>
            <BlinkitMobileHomePage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'home',
        element: (
          <AnimatedRoute>
            <BlinkitHomePage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'blinkit',
        element: (
          <AnimatedRoute>
            <BlinkitMobileHomePage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'old-home',
        element: (
          <AnimatedRoute>
            <HomePage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'app',
        element: (
          <AnimatedRoute>
            <AppHomePage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'search',
        element: (
          <AnimatedRoute>
            <SearchPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'product/:id',
        element: (
          <AnimatedRoute>
            <ProductDetailPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'cart',
        element: (
          <AnimatedRoute>
            <CartPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <AnimatedRoute>
            <CheckoutPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'order-success',
        element: (
          <AnimatedRoute>
            <OrderSuccessPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <AnimatedRoute>
            <UserDashboard />
          </AnimatedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <AnimatedRoute>
            <OrderHistoryPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'orders/:orderId/track',
        element: (
          <AnimatedRoute>
            <OrderTrackingPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'addresses',
        element: (
          <AnimatedRoute>
            <AddressManagementPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <AnimatedRoute>
            <SettingsPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'account',
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'products',
        element: <div>Products Page Coming Soon</div>,
      },
      {
        path: 'products/:id',
        element: <div>Product Detail Page Coming Soon</div>,
      },
      {
        path: 'category/:slug',
        element: <div>Category Page Coming Soon</div>,
      },
      {
        path: 'search',
        element: <div>Search Page Coming Soon</div>,
      },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <div>Cart Page Coming Soon</div>
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <div>Checkout Page Coming Soon</div>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <div>Profile Page Coming Soon</div>
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'orders',
            element: <div>Orders Page Coming Soon</div>,
          },
          {
            path: 'orders/:id',
            element: <div>Order Detail Page Coming Soon</div>,
          },
          {
            path: 'addresses',
            element: <div>Addresses Page Coming Soon</div>,
          },
          {
            path: 'settings',
            element: <div>Settings Page Coming Soon</div>,
          },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <AnimatedRoute>
            <LoginPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <AnimatedRoute>
            <RegisterPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <AnimatedRoute>
            <ForgotPasswordPage />
          </AnimatedRoute>
        ),
      },
      {
        path: 'verify-otp',
        element: (
          <AnimatedRoute>
            <OTPVerificationPage />
          </AnimatedRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <div>Admin Layout Coming Soon</div>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <div>Admin Dashboard Coming Soon</div>,
      },
      {
        path: 'products',
        element: <div>Admin Products Coming Soon</div>,
      },
      {
        path: 'orders',
        element: <div>Admin Orders Coming Soon</div>,
      },
      {
        path: 'users',
        element: <div>Admin Users Coming Soon</div>,
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">Page not found</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    ),
  },
]);

/**
 * App Router Component
 * Main router provider for the application
 */
const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
