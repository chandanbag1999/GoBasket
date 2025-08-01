import React from 'react';

interface Category {
  id: string;
  name: string;
  image: string;
  deliveryTime?: string;
}

interface BlinkitCategoryGridProps {
  categories: Category[];
  onCategoryClick?: (category: Category) => void;
}

/**
 * Blinkit Category Grid - Exact Replica
 * 4-column grid layout matching Blinkit's mobile app
 */
const BlinkitCategoryGrid: React.FC<BlinkitCategoryGridProps> = ({
  categories,
  onCategoryClick
}) => {
  // Default Blinkit categories with working image URLs
  const defaultCategories: Category[] = [
    {
      id: 'vegetables-fruits',
      name: 'Vegetables & Fruits',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'dairy-breakfast',
      name: 'Dairy & Breakfast',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'munchies',
      name: 'Munchies',
      image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'cold-drinks',
      name: 'Cold Drinks & Juices',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'instant-food',
      name: 'Instant & Frozen Food',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'tea-coffee',
      name: 'Tea, Coffee & Health Drink',
      image: 'https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'bakery-biscuits',
      name: 'Bakery & Biscuits',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'sweet-tooth',
      name: 'Sweet Tooth',
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'atta-rice',
      name: 'Atta, Rice & Dal',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'masala-oil',
      name: 'Masala, Oil & More',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'chicken-meat',
      name: 'Chicken, Meat & Fish',
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'paan-corner',
      name: 'Paan Corner',
      image: 'https://images.unsplash.com/photo-1599909533730-f9e2b5e0b5e5?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'organic-premium',
      name: 'Organic & Premium',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'baby-care',
      name: 'Baby Care',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'pharma-wellness',
      name: 'Pharma & Wellness',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'cleaning-household',
      name: 'Cleaning & Household',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'home-office',
      name: 'Home & Office',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'personal-care',
      name: 'Personal Care',
      image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'pet-care',
      name: 'Pet Care',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    },
    {
      id: 'print-store',
      name: 'Print Store',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=200&fit=crop&crop=center',
      deliveryTime: '8 MINS'
    }
  ];

  const categoriesToShow = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="bg-white">
      {/* Category Grid */}
      <div className="px-6 py-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-gray-600 text-sm">Everything delivered in 8 minutes</p>
        </div>

        <div className="grid grid-cols-4 gap-5">
          {categoriesToShow.slice(0, 12).map((category, index) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick?.(category)}
              className="group flex flex-col items-center space-y-4 p-4 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-transparent hover:border-green-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Category Image */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative shadow-lg group-hover:shadow-2xl transition-all duration-300 border-2 border-transparent group-hover:border-green-300">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-icon w-full h-full flex items-center justify-center text-3xl';
                      fallback.textContent = '🛒';
                      parent.appendChild(fallback);
                    }
                  }}
                />
                {/* Delivery Time Badge */}
                {category.deliveryTime && (
                  <div className="absolute bottom-1 left-1 right-1 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold py-1.5 text-center rounded-lg backdrop-blur-sm shadow-md">
                    {category.deliveryTime}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-green-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-2xl"></div>
              </div>

              {/* Category Name */}
              <span className="text-sm font-semibold text-gray-900 text-center leading-tight group-hover:text-green-700 transition-colors duration-300">
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Show More Categories Button */}
        {categoriesToShow.length > 12 && (
          <div className="mt-8 text-center">
            <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center space-x-2 mx-auto">
              <span>Show More Categories</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlinkitCategoryGrid;
