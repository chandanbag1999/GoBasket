import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Button Component Props Interface
 * Defines all possible props for the Button component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Modern Button Component with Multiple Variants
 * 
 * Features:
 * - Multiple visual variants (primary, secondary, outline, ghost, danger)
 * - Different sizes with mobile-first approach
 * - Loading state with spinner
 * - Icon support (left and right)
 * - Full width option
 * - Smooth animations with Framer Motion
 * - Touch-friendly minimum heights (44px)
 * - Accessibility features
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  // Base styles that apply to all button variants
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  // Variant-specific styles for different button types
  const variantStyles = {
    primary: `
      bg-orange-500 hover:bg-orange-600 text-white
      focus:ring-orange-500 shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-green-500 hover:bg-green-600 text-white
      focus:ring-green-500 shadow-sm hover:shadow-md
    `,
    outline: `
      border-2 border-orange-500 text-orange-500 hover:bg-orange-50
      focus:ring-orange-500 bg-white
    `,
    ghost: `
      text-gray-700 hover:bg-gray-100 focus:ring-gray-500
    `,
    danger: `
      bg-red-500 hover:bg-red-600 text-white
      focus:ring-red-500 shadow-sm hover:shadow-md
    `
  };

  // Size-specific styles with mobile-first approach
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]', // Touch-friendly default
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[52px]'
  };

  // Combine all styles
  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim();

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }} // Subtle press animation
      whileHover={{ scale: 1.02 }} // Subtle hover animation
      transition={{ duration: 0.1 }}
      {...props}
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
};

export default Button;
