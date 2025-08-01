import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardVariants, type CardVariants } from '@/lib/variants';

/**
 * Card Component Props Interface
 * Enhanced with our variant system
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement>, CardVariants {
  children: React.ReactNode;
  clickable?: boolean;
}

/**
 * Professional Card Component - Blinkit/BigBasket Style
 *
 * Features:
 * - Type-safe variants with CVA
 * - Multiple padding and styling options
 * - Hover effects for interactive cards
 * - Smooth animations with Framer Motion
 * - Mobile-optimized touch targets
 * - Consistent with design system
 *
 * Usage:
 * <Card variant="elevated" hover>
 *   <h3>Product Title</h3>
 *   <p>Description...</p>
 * </Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  className,
  variant = 'default',
  padding = 'default',
  hover = false,
  clickable = false,
  onClick,
  ...props
}, ref) => {
  // Use our variant system for consistent styling
  const cardClasses = cn(
    cardVariants({ variant, padding, hover }),
    clickable && 'cursor-pointer select-none',
    className
  );

  return (
    <motion.div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover || clickable ? { y: -2 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

/**
 * Card Header Component
 * For consistent card header styling
 */
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

/**
 * Card Body Component
 * For consistent card body styling
 */
interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={className}>
    {children}
  </div>
);

/**
 * Card Footer Component
 * For consistent card footer styling
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

export default Card;
