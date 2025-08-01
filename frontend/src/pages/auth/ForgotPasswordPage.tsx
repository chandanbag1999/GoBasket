import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import { Button, Input } from '@/components/ui';

// Services
import { authService } from '@/services';

// Validation
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validationSchemas';

// Constants
import { ROUTES } from '@/constants';

/**
 * Forgot Password Page Component
 * 
 * Features:
 * - Email validation
 * - Password reset request
 * - Success state
 * - Loading states
 * - Error handling
 * - Mobile-optimized
 */
const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  
  const navigate = useNavigate();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await authService.forgotPassword({
        email: data.email,
      });

      if (response.success) {
        setEmailAddress(data.email);
        setIsEmailSent(true);
        toast.success('Password reset email sent! 📧');
      } else {
        throw new Error(response.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);

      if (error.response?.status === 404) {
        setError('email', {
          message: 'No account found with this email address.',
        });
      } else {
        toast.error(error.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle resend email
   */
  const handleResendEmail = async () => {
    try {
      setIsLoading(true);

      const response = await authService.forgotPassword({
        email: emailAddress,
      });

      if (response.success) {
        toast.success('Reset email sent again! 📧');
      } else {
        throw new Error(response.error || 'Failed to resend email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isEmailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto text-center"
      >
        {/* Success Icon */}
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Check your email! 📧
        </h1>
        <p className="text-gray-600 mb-2">
          We've sent a password reset link to:
        </p>
        <p className="font-medium text-gray-900 mb-6">
          {emailAddress}
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-blue-900 mb-2">Next steps:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Check your email inbox</li>
            <li>2. Click the reset link in the email</li>
            <li>3. Create a new password</li>
            <li>4. Login with your new password</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleResendEmail}
            loading={isLoading}
            variant="outline"
          >
            {isLoading ? 'Resending...' : 'Resend Email'}
          </Button>
          
          <Button
            fullWidth
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Back to Login
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Didn't receive the email?
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-400">
              • Check your spam/junk folder
            </p>
            <p className="text-xs text-gray-400">
              • Make sure {emailAddress} is correct
            </p>
            <p className="text-xs text-gray-400">
              • Wait a few minutes and try again
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Form state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(ROUTES.LOGIN)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Login
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot Password? 🔐
        </h1>
        <p className="text-gray-600">
          No worries! Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          {...register('email')}
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          disabled={isLoading}
          helpText="We'll send password reset instructions to this email"
        />

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          disabled={!isValid}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Remember your password?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Security Note */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          🔒 For security, reset links expire in 1 hour
        </p>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;
