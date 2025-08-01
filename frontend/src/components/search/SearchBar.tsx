import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  Filter
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { VStack, HStack } from '@/components/layout/Stack';

// Hooks
import { useDebounce } from '@/hooks';

/**
 * Search Suggestion Interface
 */
interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand' | 'recent' | 'trending';
  count?: number;
  image?: string;
}

/**
 * Search Bar Component Props
 */
interface SearchBarProps {
  placeholder?: string;
  showSuggestions?: boolean;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  className?: string;
}

/**
 * Professional Search Bar - Real-time Suggestions
 * 
 * Features:
 * - Real-time search suggestions
 * - Recent searches
 * - Trending searches
 * - Category suggestions
 * - Product suggestions with images
 * - Keyboard navigation
 * - Mobile-optimized
 * 
 * Usage:
 * <SearchBar 
 *   placeholder="Search for groceries..." 
 *   showSuggestions 
 *   showFilters 
 *   onSearch={handleSearch}
 * />
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search for groceries, fruits, vegetables...",
  showSuggestions = true,
  showFilters = true,
  onSearch,
  onFilterClick,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);

  // Sample suggestions data - in real app, this would come from API
  const mockSuggestions: SearchSuggestion[] = [
    // Recent searches
    { id: '1', text: 'organic apples', type: 'recent' },
    { id: '2', text: 'fresh milk', type: 'recent' },
    
    // Trending searches
    { id: '3', text: 'mangoes', type: 'trending', count: 1250 },
    { id: '4', text: 'summer fruits', type: 'trending', count: 890 },
    
    // Categories
    { id: '5', text: 'Fruits & Vegetables', type: 'category', count: 150 },
    { id: '6', text: 'Dairy & Eggs', type: 'category', count: 85 },
    
    // Products
    { id: '7', text: 'Amul Fresh Milk 1L', type: 'product', image: '🥛' },
    { id: '8', text: 'Organic Bananas 1kg', type: 'product', image: '🍌' },
    
    // Brands
    { id: '9', text: 'Amul', type: 'brand', count: 45 },
    { id: '10', text: 'Mother Dairy', type: 'brand', count: 32 },
  ];

  // Fetch suggestions based on query
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const filtered = mockSuggestions.filter(suggestion =>
          suggestion.text.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 8));
        setIsLoading(false);
      }, 200);
    } else if (isFocused) {
      // Show recent and trending when no query
      const defaultSuggestions = mockSuggestions.filter(
        s => s.type === 'recent' || s.type === 'trending'
      ).slice(0, 6);
      setSuggestions(defaultSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query.trim());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSearch?.(suggestion.text);
    
    if (suggestion.type === 'category') {
      navigate(`/category/${suggestion.id}`);
    } else if (suggestion.type === 'product') {
      navigate(`/product/${suggestion.id}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
    }
    
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'trending': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'category': return <span className="text-blue-500">📂</span>;
      case 'product': return <span className="text-green-500">🛒</span>;
      case 'brand': return <span className="text-purple-500">🏷️</span>;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        />

        {/* Clear Button */}
        {query && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <X className="w-3 h-3 text-gray-600" />
          </motion.button>
        )}

        {/* Filter Button */}
        {showFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFilterClick}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Filter className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && isFocused && (suggestions.length > 0 || isLoading) && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                </div>
              </div>
            ) : (
              <VStack spacing="none">
                {/* Recent/Trending Header */}
                {query.length === 0 && (
                  <div className="p-3 border-b border-gray-100">
                    <HStack spacing="sm" align="center">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Recent & Trending
                      </span>
                    </HStack>
                  </div>
                )}

                {/* Suggestions List */}
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    whileHover={{ x: 2 }}
                  >
                    <HStack spacing="sm" align="center">
                      {suggestion.image ? (
                        <span className="text-lg">{suggestion.image}</span>
                      ) : (
                        getSuggestionIcon(suggestion.type)
                      )}
                      
                      <VStack spacing="none" className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 truncate">
                          {suggestion.text}
                        </span>
                        {suggestion.count && (
                          <span className="text-xs text-gray-500">
                            {suggestion.count} items
                          </span>
                        )}
                      </VStack>

                      {suggestion.type === 'trending' && (
                        <Badge variant="error" size="sm">Hot</Badge>
                      )}

                      <ArrowUpRight className="w-3 h-3 text-gray-400" />
                    </HStack>
                  </motion.button>
                ))}
              </VStack>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
