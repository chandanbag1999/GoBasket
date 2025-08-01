import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Components
import Container from './Container';

// Constants
import { ROUTES } from '@/constants';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

/**
 * Breadcrumb Component
 * 
 * Features:
 * - Auto-generate breadcrumbs from URL
 * - Clickable navigation
 * - SEO friendly
 * - Responsive design
 * - Custom breadcrumb support
 */
const Breadcrumb: React.FC<{ items?: BreadcrumbItem[] }> = ({ items }) => {
  const location = useLocation();

  /**
   * Generate breadcrumbs from current path
   */
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: ROUTES.HOME }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page
  if (location.pathname === ROUTES.HOME || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <Container>
        <nav className="py-3" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
                
                {index === 0 ? (
                  <Link
                    to={item.href || '#'}
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                ) : item.current ? (
                  <span className="text-gray-900 font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href || '#'}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </Container>
    </div>
  );
};

export default Breadcrumb;
