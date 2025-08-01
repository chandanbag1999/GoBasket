import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import SearchBar from '@/components/search/SearchBar';
import ProductGrid from '@/components/product/ProductGrid';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Container from '@/components/layout/Container';
import { VStack, HStack } from '@/components/layout/Stack';

/**
 * Search Page Component - Product Discovery
 * 
 * Features:
 * - Search bar with real-time suggestions
 * - Product grid with sorting and filtering
 * - Search history and trending searches
 * - Mobile-optimized layout
 * - Loading and empty states
 * - SEO-friendly URLs
 * 
 * Usage:
 * /search?q=apples&category=fruits&sort=price-asc
 */
const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get search query from URL
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'relevance';

  // Sample products data - in real app, this would come from API
  const mockProducts = [
    {
      id: '1',
      name: 'Fresh Red Apples',
      description: 'Crispy and sweet red apples',
      price: 120,
      originalPrice: 150,
      rating: 4.5,
      reviewCount: 234,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop',
      category: 'fruits',
      brand: 'Fresh Farm',
      unit: '1 kg',
      inStock: true,
      deliveryTime: '10 mins',
      isOrganic: true,
      isBestseller: true,
    },
    {
      id: '2',
      name: 'Organic Bananas',
      description: 'Fresh organic bananas',
      price: 60,
      rating: 4.3,
      reviewCount: 156,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop',
      category: 'fruits',
      brand: 'Organic Valley',
      unit: '1 dozen',
      inStock: true,
      deliveryTime: '15 mins',
      isOrganic: true,
    },
    {
      id: '3',
      name: 'Fresh Milk',
      description: 'Pure and fresh cow milk',
      price: 65,
      rating: 4.7,
      reviewCount: 445,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop',
      category: 'dairy',
      brand: 'Amul',
      unit: '1 liter',
      inStock: true,
      deliveryTime: '12 mins',
      isBestseller: true,
    },
    {
      id: '4',
      name: 'Whole Wheat Bread',
      description: 'Healthy whole wheat bread',
      price: 45,
      originalPrice: 55,
      rating: 4.2,
      reviewCount: 89,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop',
      category: 'bakery',
      brand: 'Harvest Gold',
      unit: '400g',
      inStock: true,
      deliveryTime: '20 mins',
    },
    {
      id: '5',
      name: 'Greek Yogurt',
      description: 'Creamy Greek style yogurt',
      price: 85,
      rating: 4.6,
      reviewCount: 167,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop',
      category: 'dairy',
      brand: 'Epigamia',
      unit: '200g',
      inStock: true,
      deliveryTime: '15 mins',
      isOrganic: true,
    },
    {
      id: '6',
      name: 'Mixed Nuts',
      description: 'Premium mixed nuts',
      price: 299,
      originalPrice: 350,
      rating: 4.4,
      reviewCount: 78,
      image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=300&h=300&fit=crop',
      category: 'snacks',
      brand: 'Nutty Gritty',
      unit: '250g',
      inStock: true,
      deliveryTime: '25 mins',
    },
  ];

  // Initialize search query from URL
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Fetch products based on search query
  useEffect(() => {
    if (query) {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const filtered = mockProducts.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          product.brand.toLowerCase().includes(query.toLowerCase())
        );
        
        setProducts(filtered);
        setLoading(false);
      }, 500);
    } else {
      setProducts([]);
    }
  }, [query, category, sort]);

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (category) params.set('category', category);
    if (sort !== 'relevance') params.set('sort', sort);
    
    navigate(`/search?${params.toString()}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getResultsText = () => {
    if (loading) return 'Searching...';
    if (!query) return 'Enter a search term to find products';
    if (products.length === 0) return `No results found for "${query}"`;
    return `${products.length} result${products.length !== 1 ? 's' : ''} for "${query}"`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        showSearch={false}
        showLocation 
        showCart 
        showNotifications 
      />

      {/* Main Content */}
      <main className="pb-20">
        <Container size="7xl" padding="lg" className="pt-4">
          <VStack spacing="lg">
            {/* Search Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <VStack spacing="md">
                {/* Back Button & Title */}
                <HStack spacing="md" align="center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h1 className="text-xl font-semibold text-gray-900 flex-1">
                    Search Products
                  </h1>
                </HStack>

                {/* Search Bar */}
                <SearchBar
                  placeholder="Search for groceries, fruits, vegetables..."
                  showSuggestions
                  showFilters
                  onSearch={handleSearch}
                />
              </VStack>
            </motion.div>

            {/* Search Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <VStack spacing="md">
                {/* Results Header */}
                <HStack justify="between" align="center">
                  <p className="text-sm text-gray-600">
                    {getResultsText()}
                  </p>
                  
                  {query && products.length > 0 && (
                    <Badge variant="primary" size="sm">
                      {products.length} found
                    </Badge>
                  )}
                </HStack>

                {/* Popular Searches (when no query) */}
                {!query && (
                  <VStack spacing="md">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Popular Searches
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {['Fruits', 'Vegetables', 'Milk', 'Bread', 'Eggs', 'Rice'].map((term) => (
                        <Button
                          key={term}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch(term.toLowerCase())}
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </VStack>
                )}

                {/* Product Grid */}
                {(query || products.length > 0) && (
                  <ProductGrid
                    products={products}
                    loading={loading}
                    showFilters
                    showSort
                    showViewToggle
                    emptyMessage={`No products found for "${query}"`}
                  />
                )}

                {/* Search Tips (when no results) */}
                {query && !loading && products.length === 0 && (
                  <VStack spacing="md" className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <SearchIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <VStack spacing="sm">
                      <h3 className="text-lg font-semibold text-gray-900">
                        No results found
                      </h3>
                      <p className="text-gray-600 max-w-md">
                        Try searching with different keywords or check the spelling.
                      </p>
                    </VStack>
                    
                    <VStack spacing="sm">
                      <p className="text-sm font-medium text-gray-700">
                        Search suggestions:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['fruits', 'vegetables', 'dairy', 'snacks'].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearch(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </VStack>
                  </VStack>
                )}
              </VStack>
            </motion.div>
          </VStack>
        </Container>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation showLabels />
    </div>
  );
};

export default SearchPage;
