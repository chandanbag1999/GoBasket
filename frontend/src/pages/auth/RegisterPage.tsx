import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import { Button, Input } from '@/components/ui';

// Services
import { authService } from '@/services';

// Validation
import { registerSchema, type RegisterFormData } from '@/utils/validationSchemas';

// Constants
import { ROUTES } from '@/constants';

/**
 * Register Page Component
 * 
 * Features:
 * - Complete registration form
 * - Form validation
 * - Password strength indicator
 * - Terms acceptance
 * - Phone number validation
 * - API integration
 * - Loading states
 * - Error handling
 */
const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Form setup with default values
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    reset,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    }
  });

  // Watch password for strength calculation
  const password = watch('password');

  /**
   * Calculate password strength - Memoized
   */
  const calculatePasswordStrength = useCallback((pass: string) => {
    if (!pass) return 0;

    let strength = 0;
    
    // Length check (8+ characters)
    if (pass.length >= 8) strength += 25;
    
    // Lowercase check
    if (/[a-z]/.test(pass)) strength += 25;
    
    // Uppercase check
    if (/[A-Z]/.test(pass)) strength += 25;
    
    // Number and special character check
    if (/\d/.test(pass) && /[@$!%*?&]/.test(pass)) strength += 25;

    return strength;
  }, []);

  /**
   * Update password strength on password change
   */
  React.useEffect(() => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  }, [password, calculatePasswordStrength]);

  /**
   * Get password strength color and text - Memoized
   */
  const getPasswordStrengthInfo = useCallback(() => {
    if (passwordStrength === 0) return { color: 'bg-gray-200', text: '' };
    if (passwordStrength <= 25) return { color: 'bg-red-500', text: 'Weak' };
    if (passwordStrength <= 50) return { color: 'bg-yellow-500', text: 'Fair' };
    if (passwordStrength <= 75) return { color: 'bg-blue-500', text: 'Good' };
    return { color: 'bg-green-500', text: 'Strong' };
  }, [passwordStrength]);

  /**
   * Handle form submission with error handling
   */
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);

      // Call register API
      const response = await authService.register({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        password: data.password,
        role: 'customer',
      });

      if (response.success) {
        // Reset form
        reset();
        
        toast.success('Account created successfully! Please verify your email. 📧');
        
        // Redirect to login with verification message
        navigate(ROUTES.LOGIN, {
          state: {
            message: 'Account created successfully! Please check your email to verify your account before logging in.',
            email: data.email
          }
        });
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle specific error types
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.error || '';
        if (errorMessage.includes('email')) {
          setError('email', {
            message: 'Email is already registered. Please use a different email.',
          });
        } else if (errorMessage.includes('phone')) {
          setError('phone', {
            message: 'Phone number is already registered.',
          });
        } else {
          toast.error('User already exists. Please check your email or phone number.');
        }
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const strengthInfo = getPasswordStrengthInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create your account 🚀
        </h1>
        <p className="text-gray-600">
          Join thousands of happy customers and start shopping
        </p>
      </div>

      {/* Benefits Banner */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <Shield className="h-4 w-4 text-primary-600 mr-2" />
          <span className="text-sm font-medium text-primary-800">
            Why join GoBasket?
          </span>
        </div>
        <ul className="text-xs text-primary-700 space-y-1">
          <li>• 10-minute delivery guaranteed</li>
          <li>• Fresh & quality products</li>
          <li>• Exclusive offers & discounts</li>
        </ul>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name */}
        <Input
          {...register('name')}
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          disabled={isLoading}
          autoComplete="name"
          required
        />

        {/* Email */}
        <Input
          {...register('email')}
          label="Email"
          type="email"
          placeholder="Enter your email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          disabled={isLoading}
          helperText="We'll send you order updates and offers"
          autoComplete="email"
          required
        />

        {/* Phone Number */}
        <Input
          {...register('phone')}
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.phone?.message}
          disabled={isLoading}
          helperText="We'll send you OTP for verification"
          autoComplete="tel"
          required
        />

        {/* Password */}
        <div>
          <Input
            {...register('password')}
            label="Password"
            type="password"
            placeholder="Create a strong password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Password strength</span>
                <span className={`text-xs font-medium ${
                  strengthInfo.color === 'bg-green-500' ? 'text-green-600' :
                  strengthInfo.color === 'bg-blue-500' ? 'text-blue-600' :
                  strengthInfo.color === 'bg-yellow-500' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {strengthInfo.text}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full ${strengthInfo.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          {...register('confirmPassword')}
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />

        {/* Terms Acceptance */}
        <div>
          <label className="flex items-start cursor-pointer">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 mt-1"
              disabled={isLoading}
              aria-invalid={errors.acceptTerms ? 'true' : 'false'}
              aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
            />
            <span className="ml-3 text-sm text-gray-600 leading-relaxed">
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-primary-600 hover:text-primary-500 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="text-primary-600 hover:text-primary-500 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="terms-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          disabled={!isValid || isLoading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Security Note */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <Shield className="h-3 w-3 mr-1" />
          <span>Your data is secure and encrypted</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
