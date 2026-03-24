import crypto from 'crypto';
import Razorpay from 'razorpay';

// Initialize Razorpay with your live keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

console.log('✅ Razorpay initialized with live keys');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Note: Using live keys in development - charges may apply!');

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethod: 'razorpay' | 'paypal' | 'paytm' | 'bhim' | 'upi' | 'card' | 'scan_qr';
  customerInfo: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  paymentUrl?: string;
  qrCode?: string;
  upiId?: string;
  key?: string; // Razorpay key for frontend
  error?: string;
}

export class PaymentService {
  static async createOrder(amount: number): Promise<PaymentResponse> {
    try {
      console.log('🔧 Creating Razorpay order for amount:', amount);
      
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: 'receipt_' + Date.now(),
        payment_capture: 1,
        notes: {
          booking_type: 'tuition_booking',
          environment: 'production_with_live_keys'
        }
      };

      console.log('🔧 Order options:', options);
      
      const order = await razorpay.orders.create(options);
      
      console.log('✅ Razorpay order created:', order);
      
      return {
        success: true,
        orderId: order.id,
        key: process.env.RAZORPAY_KEY_ID!
      };
    } catch (error: any) {
      console.error('❌ Razorpay order creation failed:', error);
      return {
        success: false,
        error: error.error?.description || error.message || 'Failed to create payment order'
      };
    }
  }

  static async verifyPayment(paymentData: any): Promise<PaymentResponse> {
    try {
      console.log('🔧 Verifying Razorpay payment:', paymentData);
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return {
          success: false,
          error: 'Missing payment verification parameters'
        };
      }

      // Generate signature for verification
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      console.log('🔍 Signature verification:', {
        received: razorpay_signature,
        expected: expectedSignature,
        match: expectedSignature === razorpay_signature
      });

      if (expectedSignature === razorpay_signature) {
        // Fetch payment details
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        console.log('✅ Payment verified successfully:', payment);
        
        return {
          success: true,
          orderId: razorpay_order_id,
          transactionId: payment.id
        };
      } else {
        return {
          success: false,
          error: 'Invalid payment signature'
        };
      }
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      return {
        success: false,
        error: error.error?.description || error.message || 'Payment verification failed'
      };
    }
  }

  static async createPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('🔧 Creating payment:', paymentRequest);
      
      // For now, just create an order
      return await this.createOrder(paymentRequest.amount);
    } catch (error: any) {
      console.error('❌ Payment creation failed:', error);
      return {
        success: false,
        error: error.error?.description || error.message || 'Payment creation failed'
      };
    }
  }
}
