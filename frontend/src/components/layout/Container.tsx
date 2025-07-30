import React from 'react';

/**
 * Container Component Props Interface
 */
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}

/**
 * Responsive Container Component
 * 
 * Features:
 * - Multiple container sizes with responsive breakpoints
 * - Optional padding for mobile-first design
 * - Centered content with max-width constraints
 * - Consistent spacing across the application
 * - Mobile-first responsive design (320px-768px primary focus)
 */
const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  padding = true,
  className = ''
}) => {
  // Container size configurations with mobile-first approach
  const sizeStyles = {
    sm: 'max-w-sm',      // 384px
    md: 'max-w-md',      // 448px  
    lg: 'max-w-4xl',     // 896px - Good for most content
    xl: 'max-w-6xl',     // 1152px - Wide layouts
    full: 'max-w-full'   // No max width
  };

  // Padding styles with mobile-first responsive padding
  const paddingStyles = padding 
    ? 'px-4 sm:px-6 lg:px-8' // 16px mobile, 24px tablet, 32px desktop
    : '';

  // Combine all styles
  const containerClasses = `
    mx-auto w-full
    ${sizeStyles[size]}
    ${paddingStyles}
    ${className}
  `.trim();

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

export default Container;
