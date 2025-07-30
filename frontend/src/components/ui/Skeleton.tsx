import React from 'react';

/**
 * Skeleton Component Props Interface
 */
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton Loading Component
 * 
 * Features:
 * - Customizable dimensions
 * - Multiple animation types
 * - Rounded corners option
 * - Responsive design
 * - Accessible loading state
 */
const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = false,
  animation = 'pulse'
}) => {
  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Can be enhanced with custom wave animation
    none: ''
  };

  // Base styles
  const baseStyles = `
    bg-gray-200 
    ${rounded ? 'rounded-full' : 'rounded-md'}
    ${animationClasses[animation]}
  `;

  // Inline styles for dimensions
  const inlineStyles: React.CSSProperties = {};
  if (width) inlineStyles.width = typeof width === 'number' ? `${width}px` : width;
  if (height) inlineStyles.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${className}`}
      style={inlineStyles}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Skeleton Text Component
 * For text loading states
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

/**
 * Skeleton Card Component
 * For card loading states
 */
export const SkeletonCard: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
    <div className="space-y-4">
      <Skeleton height={200} />
      <div className="space-y-2">
        <Skeleton height={20} width="60%" />
        <Skeleton height={16} width="80%" />
        <Skeleton height={16} width="40%" />
      </div>
    </div>
  </div>
);

export default Skeleton;
