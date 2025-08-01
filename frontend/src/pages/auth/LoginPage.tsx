import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Smartphone, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Container from '@/components/layout/Container';
import { VStack, HStack, Center, Divider } from '@/components/layout/Stack';

// Hooks
import { useAuth } from '@/hooks';

// Services
import { authService } from '@/services';

// Validation
import { loginSchema, type LoginFormData } from '@/utils/validationSchemas';

// Constants
import { ROUTES } from '@/constants';

/**
 * Login Page Component
 * 
 * Features:
 * - Form validation with React Hook Form + Yup
 * - API integration
 * - Loading states
 * - Error handling
 * - Redirect after login
 * - Remember me functionality
 * - Social login options
 * - Mobile-optimized
 */
const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get redirect path from location state
  const from = (location.state as any)?.from || ROUTES.HOME;

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      // Call login API
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        // Update auth state
        await login(response.data.user, response.data.token);

        // Show success message
        toast.success(`Welcome back, ${response.data.user.name}! 👋`);

        // Redirect to intended page
        navigate(from, { replace: true });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific error types
      if (error.response?.status === 401) {
        setError('password', {
          message: 'Invalid email or password',
        });
      } else if (error.response?.status === 403) {
        setError('email', {
          message: 'Account is not verified. Please check your email.',
        });
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Pre-fill with demo credentials
    onSubmit({
      email: 'demo@example.com', // Replace with actual demo email
      password: 'password123', // Replace with actual demo password
      rememberMe: false,
    });
  };

  

  return (
    <Container size="sm" padding="lg" className="min-h-screen">
      <Center className="min-h-screen py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <VStack spacing="lg" className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <VStack spacing="sm">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back!
              </h1>
              <p className="text-gray-600 text-lg">
                Sign in to continue your shopping journey
              </p>
            </VStack>
          </VStack>

          {/* Demo Login Banner */}
          <Card variant="outlined" padding="lg" className="mb-8 border-primary-200 bg-primary-50">
            <HStack justify="between" align="center">
              <VStack spacing="xs">
                <p className="text-sm text-primary-800 font-medium">✨ Try Demo Login</p>
                <p className="text-xs text-primary-600">
                  Quick access with pre-filled credentials
                </p>
              </VStack>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="border-primary-300 text-primary-700 hover:bg-primary-100"
              >
                Demo Login
              </Button>
            </HStack>
          </Card>

          {/* Login Form */}
          <Card variant="elevated" padding="lg" className="mb-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing="lg">
                {/* Email Input */}
                <Input
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  disabled={isLoading}
                  size="default"
                />

                {/* Password Input */}
                <Input
                  {...register('password')}
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  disabled={isLoading}
                  showPasswordToggle
                  size="default"
                />

                {/* Remember Me & Forgot Password */}
                <HStack justify="between" align="center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      {...register('rememberMe')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>

                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </HStack>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={!isValid}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="mt-2"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </VStack>
            </form>
          </Card>

          {/* Divider */}
          <div className="relative my-8">
            <Divider />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-4 bg-gray-50 text-sm text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <VStack spacing="md">
            <HStack spacing="md">
              <Button
                variant="outline"
                fullWidth
                disabled={isLoading}
                onClick={() => toast('Google login coming soon! 🚀')}
                leftIcon={
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                    className="h-4 w-4"
                  />
                }
              >
                Google
              </Button>
              <Button
                variant="outline"
                fullWidth
                disabled={isLoading}
                onClick={() => toast('Facebook login coming soon! 🚀')}
                leftIcon={
                  <div className="h-4 w-4 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                    f
                  </div>
                }
              >
                Facebook
              </Button>
            </HStack>
          </VStack>

          {/* Sign Up Link */}
          <Center className="mt-8">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </Center>

          {/* Help Section */}
          <VStack spacing="sm" className="mt-8 pt-6 border-t border-gray-200">
            <Center>
              <p className="text-xs text-gray-500">
                Need help? Contact our support team
              </p>
            </Center>
            <HStack spacing="lg" justify="center">
              <Link to="/help" className="text-xs text-primary-600 hover:text-primary-500">
                Help Center
              </Link>
              <Link to="/contact" className="text-xs text-primary-600 hover:text-primary-500">
                Contact Us
              </Link>
            </HStack>
          </VStack>
        </motion.div>
      </Center>
    </Container>
  );
};

export default LoginPage;
