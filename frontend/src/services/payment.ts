/**
 * Payment Service - Razorpay Only
 * Clean payment integration with backend API
 */

import { paymentAPI } from './api';

// Types
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  orderId?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Main Payment Service - Razorpay Integration
 */
class PaymentService {
  private razorpayKey: string;
  private isRazorpayLoaded: boolean = false;

  constructor() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    this.loadRazorpay();
  }

  /**
   * Load Razorpay script
   */
  private async loadRazorpay(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Check if already loaded
      if (window.Razorpay) {
        this.isRazorpayLoaded = true;
        return;
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        this.isRazorpayLoaded = true;
        console.log('[Payment] Razorpay loaded successfully');
      };
      
      script.onerror = () => {
        console.error('[Payment] Failed to load Razorpay');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('[Payment] Error loading Razorpay:', error);
    }
  }

  /**
   * Process Razorpay payment
   */
  async processPayment(
    orderData: any,
    userDetails: { name: string; email: string; phone: string }
  ): Promise<PaymentResult> {
    try {
      if (!this.isRazorpayLoaded || !window.Razorpay) {
        throw new Error('Razorpay not loaded');
      }

      // Create order on backend
      const orderResponse = await paymentAPI.createOrder({
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        receipt: `order_${Date.now()}`,
      });

      const order = orderResponse.data;

      // Razorpay options
      const options: RazorpayOptions = {
        key: this.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'GoBasket',
        description: 'Grocery Order Payment',
        order_id: order.id,
        handler: (response: any) => {
          console.log('[Payment] Payment successful:', response);
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone,
        },
        theme: {
          color: '#16a34a', // Green color
        },
      };

      // Create Razorpay instance and open
      return new Promise((resolve) => {
        const rzp = new window.Razorpay({
          ...options,
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              const verifyResponse = await paymentAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              resolve({
                success: true,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
            } catch (error) {
              resolve({
                success: false,
                error: 'Payment verification failed',
              });
            }
          },
          modal: {
            ondismiss: () => {
              resolve({
                success: false,
                error: 'Payment cancelled by user',
              });
            },
          },
        });

        rzp.open();
      });
    } catch (error) {
      console.error('[Payment] Payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 500000; // Max 5 lakh
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  /**
   * Get supported payment methods
   */
  getSupportedMethods(): string[] {
    return ['razorpay', 'upi', 'netbanking', 'card', 'wallet'];
  }

  /**
   * Check if payment method is available
   */
  isPaymentMethodAvailable(method: string): boolean {
    return this.getSupportedMethods().includes(method);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await paymentAPI.getPaymentStatus(paymentId);
      return response.data;
    } catch (error) {
      console.error('[Payment] Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      const response = await paymentAPI.refundPayment(paymentId, amount, reason);
      return response.data;
    } catch (error) {
      console.error('[Payment] Refund failed:', error);
      throw error;
    }
  }
}

// Export service
export const paymentService = new PaymentService();

// Payment hook
export const usePayment = () => {
  const processRazorpayPayment = async (
    orderData: any,
    userDetails: { name: string; email: string; phone: string }
  ) => {
    return paymentService.processPayment(orderData, userDetails);
  };

  return {
    processRazorpayPayment,
    validateAmount: paymentService.validateAmount,
    formatAmount: paymentService.formatAmount,
    getSupportedMethods: paymentService.getSupportedMethods,
    isPaymentMethodAvailable: paymentService.isPaymentMethodAvailable,
    getPaymentStatus: paymentService.getPaymentStatus,
    refundPayment: paymentService.refundPayment,
  };
};

export default paymentService;
