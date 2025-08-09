import { Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GoBasket...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes without layout */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      {/* App routes with layout */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/products"
                element={
                  <div className="p-8 text-center">
                    Products Page Coming Soon
                  </div>
                }
              />
              <Route
                path="/categories/:slug"
                element={
                  <div className="p-8 text-center">
                    Category Page Coming Soon
                  </div>
                }
              />
              <Route
                path="/cart"
                element={
                  <div className="p-8 text-center">Cart Page Coming Soon</div>
                }
              />
              <Route
                path="/profile"
                element={
                  <div className="p-8 text-center">
                    Profile Page Coming Soon
                  </div>
                }
              />
              <Route
                path="*"
                element={
                  <div className="p-8 text-center">404 - Page Not Found</div>
                }
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
