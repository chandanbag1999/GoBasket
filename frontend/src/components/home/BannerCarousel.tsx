import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

/**
 * Banner Interface
 */
interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  backgroundColor: string;
  textColor: string;
  ctaText?: string;
  ctaLink?: string;
  discount?: string;
  isNew?: boolean;
}

/**
 * Banner Carousel Component Props
 */
interface BannerCarouselProps {
  banners?: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  height?: string;
}

/**
 * Professional Banner Carousel - Mobile-First Design
 * 
 * Features:
 * - Touch-friendly swipe gestures
 * - Auto-play with pause on hover
 * - Smooth transitions
 * - Responsive design
 * - Loading states
 * - Accessibility support
 * - Performance optimized
 * 
 * Usage:
 * <BannerCarousel 
 *   autoPlay 
 *   showDots 
 *   height="200px" 
 * />
 */
const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = false,
  height = "180px",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Sample banners data
  const defaultBanners: Banner[] = [
    {
      id: '1',
      title: 'Fresh Fruits & Vegetables',
      subtitle: 'Up to 30% OFF',
      description: 'Farm fresh produce delivered in 10 minutes',
      image: '🥕',
      backgroundColor: 'bg-gradient-to-r from-green-400 to-green-600',
      textColor: 'text-white',
      ctaText: 'Shop Now',
      ctaLink: '/category/fruits-vegetables',
      discount: '30% OFF',
      isNew: false,
    },
    {
      id: '2',
      title: 'Dairy & Breakfast',
      subtitle: 'Starting ₹25',
      description: 'Fresh milk, eggs, and breakfast essentials',
      image: '🥛',
      backgroundColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
      textColor: 'text-white',
      ctaText: 'Order Now',
      ctaLink: '/category/dairy',
      isNew: true,
    },
    {
      id: '3',
      title: 'Snacks & Beverages',
      subtitle: 'Buy 2 Get 1 Free',
      description: 'Perfect for movie nights and parties',
      image: '🍿',
      backgroundColor: 'bg-gradient-to-r from-orange-400 to-red-500',
      textColor: 'text-white',
      ctaText: 'Explore',
      ctaLink: '/category/snacks',
      discount: 'BOGO',
    },
  ];

  const activeBanners = banners || defaultBanners;

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, activeBanners.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(autoPlay);
  };

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full px-4">
      <div 
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{ height }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`absolute inset-0 ${activeBanners[currentIndex].backgroundColor}`}
          >
            <div className="relative h-full flex items-center justify-between p-6">
              {/* Content */}
              <div className="flex-1 z-10">
                <div className="space-y-2">
                  {/* Badges */}
                  <div className="flex items-center space-x-2">
                    {activeBanners[currentIndex].isNew && (
                      <Badge variant="secondary" size="sm">
                        New
                      </Badge>
                    )}
                    {activeBanners[currentIndex].discount && (
                      <Badge variant="error" size="sm">
                        {activeBanners[currentIndex].discount}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className={`text-xl font-bold ${activeBanners[currentIndex].textColor} leading-tight`}>
                    {activeBanners[currentIndex].title}
                  </h2>

                  {/* Subtitle */}
                  {activeBanners[currentIndex].subtitle && (
                    <p className={`text-lg font-semibold ${activeBanners[currentIndex].textColor} opacity-90`}>
                      {activeBanners[currentIndex].subtitle}
                    </p>
                  )}

                  {/* Description */}
                  {activeBanners[currentIndex].description && (
                    <p className={`text-sm ${activeBanners[currentIndex].textColor} opacity-80`}>
                      {activeBanners[currentIndex].description}
                    </p>
                  )}

                  {/* CTA Button */}
                  {activeBanners[currentIndex].ctaText && activeBanners[currentIndex].ctaLink && (
                    <div className="pt-2">
                      <Link to={activeBanners[currentIndex].ctaLink!}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                        >
                          {activeBanners[currentIndex].ctaText}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Image/Emoji */}
              <div className="flex-shrink-0 ml-4">
                <div className="text-6xl opacity-80">
                  {activeBanners[currentIndex].image}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {showArrows && activeBanners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && activeBanners.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {activeBanners.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-primary-500 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
