import React from 'react';
import { motion } from 'framer-motion';

/**
 * Badge Component Props Interface
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

/**
 * Versatile Badge Component
 * 
 * Features:
 * - Multiple color variants
 * - Different sizes
 * - Rounded option
 * - Smooth animations
 * - Mobile-friendly design
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = true,
  className = ''
}) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200
    ${rounded ? 'rounded-full' : 'rounded-md'}
  `;

  // Variant styles
  const variantStyles = {
    primary: 'bg-orange-100 text-orange-800 border border-orange-200',
    secondary: 'bg-green-100 text-green-800 border border-green-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // Combine styles
  const badgeClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim();

  return (
    <motion.span
      className={badgeClasses}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
