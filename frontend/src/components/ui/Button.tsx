import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariants } from '@/lib/variants';

/**
 * Button Component Props Interface
 * Enhanced with our variant system for better type safety
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Professional Button Component - Blinkit/BigBasket Style
 *
 * Features:
 * - Type-safe variants with CVA (Class Variance Authority)
 * - Mobile-first design with 44px touch targets
 * - Smooth animations with Framer Motion
 * - Loading states with spinner
 * - Icon support (left and right)
 * - Full accessibility support
 * - Consistent with design system
 *
 * Usage:
 * <Button variant="default" size="lg" loading={isLoading}>
 *   Add to Cart
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}, ref) => {
  // Use our variant system for consistent styling
  const buttonClasses = cn(
    buttonVariants({ variant, size, fullWidth }),
    className
  );

  const {
    onAnimationStart,
    onAnimationEnd,
    onDrag,
    onDragStart,
    onDragEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }} // Subtle press animation
      whileHover={{ scale: 1.02 }} // Subtle hover animation
      transition={{ duration: 0.1 }}
      {...buttonProps}
    >
      {/* Left Icon */}
      {leftIcon && !loading && (
        <span className="mr-2 flex-shrink-0">
          {leftIcon}
        </span>
      )}

      {/* Loading Spinner */}
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
      )}

      {/* Button Text */}
      <span className="truncate">
        {children}
      </span>

      {/* Right Icon */}
      {rightIcon && !loading && (
        <span className="ml-2 flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
