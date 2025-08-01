import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { badgeVariants, type BadgeVariants } from '@/lib/variants';

/**
 * Badge Component Props Interface
 * Enhanced with our variant system
 */
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, BadgeVariants {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Professional Badge Component - Blinkit/BigBasket Style
 *
 * Features:
 * - Type-safe variants with CVA
 * - Multiple sizes and colors
 * - Icon support
 * - Smooth animations
 * - Mobile-optimized
 * - Consistent with design system
 *
 * Usage:
 * <Badge variant="success" size="lg" icon={<CheckIcon />}>
 *   In Stock
 * </Badge>
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({
  children,
  variant = 'default',
  size = 'default',
  icon,
  className,
  ...props
}, ref) => {
  // Use our variant system for consistent styling
  const badgeClasses = cn(
    badgeVariants({ variant, size }),
    className
  );

  return (
    <motion.div
      ref={ref}
      className={badgeClasses}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon */}
      {icon && (
        <span className="mr-1 flex-shrink-0">
          {icon}
        </span>
      )}

      {/* Badge Text */}
      <span className="truncate">
        {children}
      </span>
    </motion.div>
  );
});

Badge.displayName = 'Badge';

export default Badge;
