import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HomePage } from '@/pages';
import { ROUTES } from '@/constants';

/**
 * Query Client Configuration
 * React Query client with default options
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Main App Component
 *
 * Features:
 * - React Router for navigation
 * - React Query for data fetching
 * - Toast notifications
 * - Global providers setup
 * - Route configuration
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          {/* Main Routes */}
          <Routes>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            {/* Add more routes as we build them */}
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
