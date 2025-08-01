import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal,
  Camera,
  CheckCircle,
  Filter
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { VStack, HStack } from '@/components/layout/Stack';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Review Interface
 */
interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  images?: string[];
  variant?: string; // e.g., "1kg", "Red Color"
}

/**
 * Product Reviews Component Props
 */
interface ProductReviewsProps {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  reviews: Review[];
  onWriteReview?: () => void;
  onHelpful?: (reviewId: string) => void;
  onNotHelpful?: (reviewId: string) => void;
}

/**
 * Professional Product Reviews - Trust Building Component
 * 
 * Features:
 * - Overall rating with distribution
 * - Individual reviews with photos
 * - Helpful/not helpful voting
 * - Verified purchase badges
 * - Filter and sort options
 * - Write review functionality
 * - Mobile-optimized layout
 * 
 * Usage:
 * <ProductReviews 
 *   productId="123"
 *   averageRating={4.5}
 *   totalReviews={234}
 *   reviews={reviewsData}
 * />
 */
const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  averageRating,
  totalReviews,
  ratingDistribution,
  reviews,
  onWriteReview,
  onHelpful,
  onNotHelpful,
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful' | 'rating'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRatingPercentage = (rating: number) => {
    return totalReviews > 0 ? (ratingDistribution[rating] / totalReviews) * 100 : 0;
  };

  return (
    <VStack spacing="lg">
      {/* Overall Rating Summary */}
      <Card variant="outlined" padding="lg">
        <VStack spacing="md">
          <h3 className="text-lg font-semibold text-gray-900">
            Customer Reviews
          </h3>
          
          <HStack spacing="lg" align="start">
            {/* Average Rating */}
            <VStack spacing="sm" align="center" className="flex-shrink-0">
              <div className="text-3xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </div>
              {renderStars(averageRating, 'lg')}
              <p className="text-sm text-gray-600">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </p>
            </VStack>

            {/* Rating Distribution */}
            <VStack spacing="xs" className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <HStack key={rating} spacing="sm" align="center" className="w-full">
                  <span className="text-sm text-gray-600 w-8">
                    {rating}★
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-yellow-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getRatingPercentage(rating)}%` }}
                      transition={{ duration: 0.5, delay: rating * 0.1 }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {ratingDistribution[rating] || 0}
                  </span>
                </HStack>
              ))}
            </VStack>
          </HStack>

          {/* Write Review Button */}
          {onWriteReview && (
            <Button
              variant="outline"
              fullWidth
              onClick={onWriteReview}
              leftIcon={<Star className="w-4 h-4" />}
            >
              Write a Review
            </Button>
          )}
        </VStack>
      </Card>

      {/* Filters and Sort */}
      <HStack spacing="md" justify="between" align="center" className="flex-wrap gap-2">
        <HStack spacing="sm">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filter
          </Button>
          
          {/* Rating Filter Pills */}
          <div className="flex space-x-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterRating === rating
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rating}★
              </button>
            ))}
          </div>
        </HStack>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rating</option>
        </select>
      </HStack>

      {/* Reviews List */}
      <VStack spacing="md">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card variant="outlined" padding="lg">
              <VStack spacing="md">
                {/* Review Header */}
                <HStack spacing="md" justify="between" align="start">
                  <HStack spacing="sm" align="center">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {review.userAvatar ? (
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-600 font-semibold text-sm">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <VStack spacing="xs">
                      <HStack spacing="sm" align="center">
                        <span className="font-medium text-gray-900">
                          {review.userName}
                        </span>
                        {review.verified && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing="sm" align="center">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-xs text-gray-500">
                          {formatDate(review.date)}
                        </span>
                      </HStack>
                    </VStack>
                  </HStack>

                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </HStack>

                {/* Review Content */}
                <VStack spacing="sm">
                  {review.title && (
                    <h4 className="font-semibold text-gray-900">
                      {review.title}
                    </h4>
                  )}
                  
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>

                  {review.variant && (
                    <p className="text-sm text-gray-500">
                      Variant: {review.variant}
                    </p>
                  )}
                </VStack>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.images.map((image, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`Review image ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Actions */}
                <HStack spacing="md" justify="between" align="center">
                  <HStack spacing="sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHelpful?.(review.id)}
                      leftIcon={<ThumbsUp className="w-4 h-4" />}
                    >
                      Helpful ({review.helpful})
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNotHelpful?.(review.id)}
                      leftIcon={<ThumbsDown className="w-4 h-4" />}
                    >
                      {review.notHelpful}
                    </Button>
                  </HStack>

                  <span className="text-xs text-gray-500">
                    Was this helpful?
                  </span>
                </HStack>
              </VStack>
            </Card>
          </motion.div>
        ))}
      </VStack>

      {/* Load More Reviews */}
      {reviews.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Reviews
          </Button>
        </div>
      )}
    </VStack>
  );
};

export default ProductReviews;
