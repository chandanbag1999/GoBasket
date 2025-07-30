import React from 'react';
import { User } from 'lucide-react';

/**
 * Avatar Component Props Interface
 */
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar Component for User Profile Images
 * 
 * Features:
 * - Multiple sizes
 * - Fallback to initials or icon
 * - Error handling for broken images
 * - Clickable option
 * - Accessible design
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  fallback,
  className = '',
  onClick
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Size configurations
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl'
  };

  // Icon sizes for fallback
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10'
  };

  const baseClasses = `
    ${sizeClasses[size]}
    rounded-full bg-gray-100 flex items-center justify-center
    overflow-hidden border-2 border-gray-200
    ${onClick ? 'cursor-pointer hover:border-orange-300 transition-colors' : ''}
    ${className}
  `;

  const handleImageError = () => {
    setImageError(true);
  };

  const renderFallback = () => {
    if (fallback) {
      return (
        <span className="font-medium text-gray-600 uppercase">
          {fallback.slice(0, 2)}
        </span>
      );
    }
    
    return (
      <User className={`${iconSizes[size]} text-gray-400`} />
    );
  };

  return (
    <div className={baseClasses} onClick={onClick}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
};

export default Avatar;
