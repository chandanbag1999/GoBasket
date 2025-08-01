import * as yup from 'yup';
import { parsePhoneNumber } from 'libphonenumber-js';

/**
 * Validation Schemas using Yup
 * 
 * Features:
 * - Comprehensive field validation
 * - Custom error messages
 * - Phone number validation for India
 * - Password strength validation
 * - Email format validation
 */

// Custom phone validation
const phoneValidation = yup
  .string()
  .required('Phone number is required')
  .test('phone', 'Please enter a valid Indian phone number', function(value) {
    if (!value) return false;
    
    try {
      const phoneNumber = parsePhoneNumber(value, 'IN');
      return phoneNumber.isValid();
    } catch (error) {
      return false;
    }
  });

// Custom password validation
const passwordValidation = yup
  .string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  );

/**
 * Login Form Schema
 */
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: yup.boolean().optional(),
});

/**
 * Register Form Schema
 */
export const registerSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  phone: phoneValidation,
  password: passwordValidation,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  acceptTerms: yup
    .boolean()
    .required('You must accept the terms and conditions')
    .oneOf([true], 'You must accept the terms and conditions'),
});

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
});

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = yup.object({
  password: passwordValidation,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

/**
 * OTP Verification Schema
 */
export const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .length(6, 'OTP must be 6 digits'),
});

/**
 * Profile Update Schema
 */
export const profileUpdateSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  phone: phoneValidation,
  dateOfBirth: yup
    .date()
    .optional()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'You must be at least 13 years old', function(value) {
      if (!value) return true;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13;
    }),
  gender: yup
    .string()
    .optional()
    .oneOf(['male', 'female', 'other', 'prefer-not-to-say'], 'Invalid gender'),
});

/**
 * Address Form Schema
 */
export const addressSchema = yup.object({
  title: yup
    .string()
    .required('Address title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(30, 'Title cannot exceed 30 characters'),
  addressLine1: yup
    .string()
    .required('Address line 1 is required')
    .min(5, 'Address must be at least 5 characters')
    .max(100, 'Address cannot exceed 100 characters'),
  addressLine2: yup
    .string()
    .optional()
    .max(100, 'Address cannot exceed 100 characters'),
  city: yup
    .string()
    .required('City is required')
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters'),
  state: yup
    .string()
    .required('State is required')
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State cannot exceed 50 characters'),
  pincode: yup
    .string()
    .required('Pincode is required')
    .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode'),
  isDefault: yup.boolean().optional(),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: passwordValidation,
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

// Type inference for forms
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
export type OTPFormData = yup.InferType<typeof otpSchema>;
export type ProfileUpdateFormData = yup.InferType<typeof profileUpdateSchema>;
export type AddressFormData = yup.InferType<typeof addressSchema>;
export type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;
