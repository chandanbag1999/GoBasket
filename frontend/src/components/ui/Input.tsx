import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputVariants, type InputVariants } from '@/lib/variants';

/**
 * Input Component Props Interface
 * Enhanced with our variant system for consistent styling
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, InputVariants {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

/**
 * Modern Input Component with Enhanced Features
 * 
 * Features:
 * - Label and helper text support
 * - Error state with validation messages
 * - Icon support (left and right)
 * - Password visibility toggle
 * - Full width option
 * - Smooth focus animations
 * - Mobile-first responsive design
 * - Accessibility features (ARIA labels, focus management)
 * - Forward ref support for form libraries
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  size = 'default',
  variant = 'default',
  type = 'text',
  className,
  id,
  ...props
}, ref) => {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine actual input type (handle password toggle)
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type;

  // Use our variant system for consistent styling
  const inputClasses = cn(
    inputVariants({
      size,
      variant: error ? 'error' : variant
    }),
    leftIcon && 'pl-10',
    (rightIcon || showPasswordToggle) && 'pr-10',
    className
  );

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={ref}
          id={inputId}
          type={inputType}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : undefined
          }
          initial={{ scale: 1 }}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.1 }}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || showPasswordToggle) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {showPasswordToggle && type === 'password' ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            ) : rightIcon ? (
              <span className="text-gray-400">
                {rightIcon}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          id={`${inputId}-error`}
          className="mt-1 flex items-center text-sm text-red-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p 
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

// Display name for debugging
Input.displayName = 'Input';

export default Input;
