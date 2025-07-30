import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShoppingCart } from 'lucide-react';

/**
 * Loading Component Props Interface
 */
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'cart';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Versatile Loading Component with Multiple Variants
 * 
 * Features:
 * - Multiple loading animations (spinner, dots, pulse, cart)
 * - Different sizes
 * - Optional loading text
 * - Full screen overlay option
 * - Smooth animations with Framer Motion
 * - Accessible with proper ARIA labels
 */
const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = ''
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { icon: 'h-4 w-4', text: 'text-sm', container: 'gap-2' },
    md: { icon: 'h-6 w-6', text: 'text-base', container: 'gap-3' },
    lg: { icon: 'h-8 w-8', text: 'text-lg', container: 'gap-4' },
    xl: { icon: 'h-12 w-12', text: 'text-xl', container: 'gap-5' }
  };

  const config = sizeConfig[size];

  /**
   * Spinner Loading Animation
   * Classic rotating spinner using Lucide icon
   */
  const SpinnerLoader = () => (
    <Loader2 className={`${config.icon} animate-spin text-orange-500`} />
  );

  /**
   * Dots Loading Animation
   * Three bouncing dots animation
   */
  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} bg-orange-500 rounded-full`}
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );

  /**
   * Pulse Loading Animation
   * Pulsing circle animation
   */
  const PulseLoader = () => (
    <motion.div
      className={`${config.icon} bg-orange-500 rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1,
        repeat: Infinity
      }}
    />
  );

  /**
   * Cart Loading Animation
   * Shopping cart with bouncing animation for e-commerce context
   */
  const CartLoader = () => (
    <motion.div
      animate={{
        y: [0, -5, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{
        duration: 1,
        repeat: Infinity
      }}
    >
      <ShoppingCart className={`${config.icon} text-orange-500`} />
    </motion.div>
  );

  // Select the appropriate loader component
  const LoaderComponent = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      case 'cart':
        return <CartLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  // Loading content
  const LoadingContent = () => (
    <div 
      className={`flex flex-col items-center justify-center ${config.container} ${className}`}
      role="status"
      aria-label={text || 'Loading'}
    >
      <LoaderComponent />
      {text && (
        <motion.p
          className={`${config.text} text-gray-600 font-medium`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  // Full screen overlay
  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <LoadingContent />
      </motion.div>
    );
  }

  // Inline loading
  return <LoadingContent />;
};

/**
 * Page Loading Component
 * Specialized loading component for full page loads
 */
export const PageLoading: React.FC<{ text?: string }> = ({ 
  text = 'Loading GoBasket...' 
}) => (
  <Loading
    size="lg"
    variant="cart"
    text={text}
    fullScreen
  />
);

/**
 * Button Loading Component
 * Specialized loading component for buttons
 */
export const ButtonLoading: React.FC = () => (
  <Loading
    size="sm"
    variant="spinner"
    className="text-current"
  />
);

/**
 * Card Loading Component
 * Specialized loading component for cards
 */
export const CardLoading: React.FC<{ text?: string }> = ({ 
  text = 'Loading...' 
}) => (
  <div className="flex items-center justify-center py-8">
    <Loading
      size="md"
      variant="dots"
      text={text}
    />
  </div>
);

export default Loading;
