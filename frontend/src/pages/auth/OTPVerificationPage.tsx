import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Shield, Clock, Smartphone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Container from '@/components/layout/Container';
import { VStack, HStack, Center } from '@/components/layout/Stack';
import OTPInput from '@/components/auth/OTPInput';

// Services
import { authService } from '@/services';

// Validation
import { otpSchema, type OTPFormData } from '@/utils/validationSchemas';

// Constants
import { ROUTES } from '@/constants';

/**
 * OTP Verification Page Component
 * 
 * Features:
 * - 6-digit OTP input with auto-focus
 * - Countdown timer for resend
 * - Auto-submit when complete
 * - Keyboard navigation
 * - Paste support
 * - Loading states
 * - Error handling
 * - Mobile-optimized
 */
const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Get email/phone from location state
  const { email, phone, verificationType = 'email' } = (location.state as any) || {};

  // Form setup
  const {
    handleSubmit,
    setError,
    clearErrors,
  } = useForm<OTPFormData>({
    resolver: yupResolver(otpSchema),
  });

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  /**
   * Redirect if no email/phone provided
   */
  useEffect(() => {
    if (!email && !phone) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [email, phone, navigate]);

  /**
   * Handle OTP input change
   */
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear errors when user starts typing
    clearErrors();

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      setTimeout(() => {
        handleVerification(newOtp.join(''));
      }, 100);
    }
  };

  /**
   * Handle backspace
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle paste
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      
      // Auto-submit pasted OTP
      setTimeout(() => {
        handleVerification(pastedData);
      }, 100);
    }
  };

  /**
   * Handle OTP verification
   */
  const handleVerification = async (otpCode: string) => {
    try {
      setIsLoading(true);

      const response = await authService.verifyOTP({
        [verificationType]: email || phone,
        otp: otpCode,
        type: verificationType,
      });

      if (response.success) {
        toast.success('Verification successful! ✅');
        
        // Redirect based on verification type
        if (verificationType === 'email') {
          navigate(ROUTES.LOGIN, {
            state: { 
              message: 'Email verified successfully. You can now login.',
              email: email 
            }
          });
        } else {
          navigate(ROUTES.PROFILE, { replace: true });
        }
      } else {
        throw new Error(response.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // Show error
      if (error.response?.status === 400) {
        setError('otp', {
          message: 'Invalid OTP. Please check and try again.',
        });
      } else {
        toast.error(error.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle resend OTP
   */
  const handleResendOTP = async () => {
    try {
      setIsResending(true);

      const response = await authService.resendOTP({
        [verificationType]: email || phone,
        type: verificationType,
      });

      if (response.success) {
        toast.success('OTP sent successfully! 📱');
        setTimeLeft(30);
        setCanResend(false);
        
        // Clear current OTP
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(response.error || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <HStack justify="between" align="center" className="w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div className="w-10" /> {/* Spacer */}
            </HStack>

            <VStack spacing="sm">
              <h1 className="text-3xl font-bold text-gray-900">
                Verify Your {verificationType === 'email' ? 'Email' : 'Phone'}
              </h1>
              <p className="text-gray-600 text-center">
                We've sent a 6-digit verification code to
              </p>
              <Badge variant="primary" size="lg">
                {email || phone}
              </Badge>
            </VStack>
          </VStack>

          {/* OTP Input Card */}
          <Card variant="elevated" padding="lg" className="mb-6">
            <VStack spacing="lg">
              <VStack spacing="md" align="center">
                <p className="text-sm text-gray-600 text-center">
                  Enter the 6-digit code sent to your {verificationType}
                </p>

                <OTPInput
                  length={6}
                  value={otp.join('')}
                  onChange={(value) => setOtp(value.split(''))}
                  onComplete={handleVerify}
                  disabled={isLoading}
                />
              </VStack>

              {/* Verify Button */}
              <Button
                variant="default"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={otp.join('').length !== 6}
                onClick={handleVerify}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </VStack>
          </Card>

          {/* Resend Section */}
          <Center>
            <VStack spacing="md" align="center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>

              {!canResend ? (
                <HStack spacing="sm" align="center">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    Resend code in {formatTime(timeLeft)}
                  </p>
                </HStack>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOTP}
                  loading={isResending}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="text-primary-600"
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Button>
              )}
            </VStack>
          </Center>

          {/* Help Text */}
          <Center className="mt-8">
            <VStack spacing="sm" align="center">
              <p className="text-xs text-gray-500 text-center">
                Having trouble? Check your spam folder or contact support
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.REGISTER)}
                className="text-primary-600"
              >
                Update {verificationType === 'email' ? 'Email' : 'Phone'}
              </Button>
            </VStack>
          </Center>
        </motion.div>
      </Center>
    </Container>
  );
};

export default OTPVerificationPage;
