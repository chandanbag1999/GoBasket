import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

// Layout Components
import Header from './Header';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import Breadcrumb from './Breadcrumb';

// Hooks
import { useMediaQuery } from '@/hooks';

/**
 * Main App Layout Component
 * 
 * Features:
 * - Responsive header with mobile menu
 * - Bottom navigation for mobile
 * - Breadcrumb navigation
 * - Footer for desktop
 * - Smooth page transitions
 * - Mobile-first design
 */
const AppLayout: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Breadcrumb - Desktop only */}
      {!isMobile && <Breadcrumb />}

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNavigation />}

      {/* Footer - Desktop only */}
      {!isMobile && <Footer />}
    </div>
  );
};

export default AppLayout;
