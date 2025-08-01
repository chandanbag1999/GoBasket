import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components
import Container from './Container';

// Hooks
import { useAuth } from '@/hooks';

// Constants
import { ROUTES } from '@/constants';

/**
 * Authentication Layout Component
 * 
 * Features:
 * - Clean, minimal design for auth pages
 * - Auto redirect if already authenticated
 * - Responsive layout
 * - Smooth animations
 * - Background patterns
 */
const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 opacity-60" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      {/* Content */}
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center space-x-2 mb-2">
                <div className="bg-primary-500 text-white rounded-xl p-3">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L17 18"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-display font-bold text-gray-900">
                  GoBasket
                </span>
              </div>
              <p className="text-gray-600">
                India's fastest grocery delivery
              </p>
            </div>

            {/* Auth Form Container */}
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
              >
                <Outlet />
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 text-center text-sm text-gray-500"
            >
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default AuthLayout;
