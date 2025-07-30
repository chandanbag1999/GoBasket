import React from 'react';
import { motion } from 'framer-motion';

/**
 * Card Component Props Interface
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  border?: boolean;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

/**
 * Versatile Card Component for Content Containers
 * 
 * Features:
 * - Multiple padding options
 * - Configurable shadow levels
 * - Border radius options
 * - Optional border
 * - Hover effects
 * - Clickable variant with animations
 * - Mobile-first responsive design
 * - Smooth animations with Framer Motion
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  rounded = 'lg',
  border = true,
  hover = false,
  clickable = false,
  onClick,
}) => {
  // Base card styles
  const baseStyles = 'bg-white transition-all duration-200';

  // Padding options
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10'
  };

  // Shadow options
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  // Border radius options
  const roundedStyles = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  // Border styles
  const borderStyles = border ? 'border border-gray-200' : '';

  // Hover effects
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';

  // Clickable styles
  const clickableStyles = clickable ? 'cursor-pointer select-none' : '';

  // Combine all styles
  const cardClasses = `
    ${baseStyles}
    ${paddingStyles[padding]}
    ${shadowStyles[shadow]}
    ${roundedStyles[rounded]}
    ${borderStyles}
    ${hoverStyles}
    ${clickableStyles}
    ${className}
  `.trim();

  // Animation variants for clickable cards
  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  // Render clickable card with animations
  if (clickable || onClick) {
    return (
      <motion.div
        className={cardClasses}
        onClick={onClick}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        transition={{ duration: 0.1 }}
      >
        {children}
      </motion.div>
    );
  }

  // Render static card
  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

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
