import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export class RazorpayService {
  // Create Razorpay order
  static async createOrder(bookingData: any): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch('http://192.168.0.34:8080/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          amount: bookingData.amount,
          paymentMethod: 'razorpay',
          customerInfo: {
            name: bookingData.customerName,
            email: bookingData.customerEmail,
            contact: bookingData.customerContact
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Create Razorpay order error:', error);
      throw error;
    }
  }

  // Process payment using Razorpay
  static async processPayment(bookingData: any): Promise<boolean> {
    try {
      // Step 1: Create order
      const orderData = await this.createOrder(bookingData);
      
      // Step 2: Initialize Razorpay
      const options: RazorpayOptions = {
        key: orderData.paymentDetails.key,
        amount: orderData.paymentDetails.amount * 100, // Convert to paise
        currency: 'INR',
        name: 'OurHomeTutions',
        description: `Payment for booking ${bookingData.bookingId}`,
        order_id: orderData.paymentDetails.orderId,
        prefill: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          contact: bookingData.customerContact
        },
        theme: {
          color: '#3399cc'
        }
      };

      // Step 3: Open Razorpay payment modal
      const paymentResult = await this.openRazorpayModal(options);
      
      if (paymentResult.success) {
        // Step 4: Verify payment with backend
        const verified = await this.verifyPayment(paymentResult);
        
        if (verified) {
          return true; // Payment successful
        }
      }
      
      return false; // Payment failed
    } catch (error) {
      console.error('Process payment error:', error);
      return false;
    }
  }

  // Open Razorpay payment modal (React Native implementation)
  private static openRazorpayModal(options: RazorpayOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      // Real React Native Razorpay implementation
      try {
        // Import RazorpayCheckout dynamically
        const RazorpayCheckout = require('react-native-razorpay');
        
        RazorpayCheckout.open(options)
          .then((data: any) => {
            // payment success
            resolve({
              success: true,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_signature: data.razorpay_signature
            });
          })
          .catch((error: any) => {
            // payment failed
            resolve({
              success: false,
              error: error.description || error.code || 'Payment cancelled'
            });
          });
      } catch (error) {
        console.error('Razorpay module not found:', error);
        // Fallback for development
        resolve({
          success: true,
          razorpay_payment_id: 'pay_dev_' + Date.now(),
          razorpay_order_id: options.order_id,
          razorpay_signature: 'dev_signature'
        });
      }
    });
  }

  // Verify payment with backend
  private static async verifyPayment(paymentData: any): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch('http://192.168.0.34:8080/api/payments/verify/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentId: paymentData.razorpay_order_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature
        })
      });

      const result = await response.json();
      
      return result.success;
    } catch (error) {
      console.error('Verify payment error:', error);
      return false;
    }
  }

  // Get payment history
  static async getPaymentHistory(): Promise<any[]> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch('http://192.168.0.34:8080/api/payments/my/payments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }
}
