import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';
import { DatabaseService } from '../services/databaseService';
import { validate } from '../middleware/validation';
import { supabase } from '../config/supabase';
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Apply authentication middleware to all routes
router.use(authenticate);

// Create payment for any payment method
router.post('/create', [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').isIn(['razorpay', 'paypal', 'paytm', 'bhim', 'upi', 'card', 'scan_qr']).withMessage('Invalid payment method'),
  body('customerInfo.name').notEmpty().withMessage('Customer name is required'),
  body('customerInfo.email').isEmail().withMessage('Valid email is required'),
  body('customerInfo.contact').matches(/^[6-9]\d{9}$/).withMessage('Contact must be a valid 10-digit mobile number')
], validate, async (req: any, res: any): Promise<void> => {
  try {
    const { bookingId, amount, paymentMethod, customerInfo } = req.body;
    const userId = (req.user as any)?.id;

    // Verify booking belongs to user
    const booking = await DatabaseService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.parent_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const paymentRequest = {
      bookingId,
      amount,
      paymentMethod,
      customerInfo
    };

    const paymentResponse = await PaymentService.createPayment(paymentRequest);

    if (paymentResponse.success) {
      // Create payment record in database
      const paymentData = {
        booking_id: bookingId,
        amount,
        currency: 'INR',
        status: 'pending',
        payment_method: paymentMethod,
        transaction_id: paymentResponse.transactionId || paymentResponse.paymentId,
        created_at: new Date(),
        updated_at: new Date()
      };

      const payment = await DatabaseService.createPayment(paymentData);

      res.json({
        success: true,
        message: 'Payment created successfully',
        data: {
          payment,
          paymentDetails: paymentResponse
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResponse.error || 'Failed to create payment'
      });
    }

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify payment (webhook endpoints)
router.post('/verify/:paymentMethod', [
  param('paymentMethod').isIn(['razorpay', 'paypal', 'paytm']).withMessage('Invalid payment method'),
  body('paymentId').notEmpty().withMessage('Payment ID is required')
], validate, async (req: any, res: any): Promise<void> => {
  try {
    const { paymentMethod } = req.params;
    const paymentData = req.body;

    const verificationResponse = await PaymentService.verifyPayment(paymentMethod, paymentData);

    if (verificationResponse.success) {
      // Update payment status in database
      const updated = await PaymentService.updatePaymentStatus(
        paymentData.paymentId,
        'completed',
        verificationResponse.transactionId
      );

      if (updated) {
        // Update booking status to confirmed
        const payment = await DatabaseService.getBookingById(paymentData.paymentId);
        if (payment) {
          await DatabaseService.updateBookingStatus(payment.booking_id, 'confirmed', (req.user as any)?.id);
        }

        res.json({
          success: true,
          message: 'Payment verified and booking confirmed',
          transactionId: verificationResponse.transactionId
        });
      } else {
        res.status(500).json({ success: false, message: 'Failed to update payment status' });
      }
    } else {
      res.status(400).json({
        success: false,
        message: verificationResponse.error || 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Razorpay specific webhook
router.post('/razorpay/webhook', async (req: any, res: any) => {
  try {
    const { 
      entity, 
      payment: { 
        id: paymentId, 
        order_id: orderId, 
        status, 
        amount, 
        notes 
      } 
    } = req.body;

    if (entity === 'payment' && status === 'captured') {
      // Find payment by transaction ID
      const payments = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', orderId)
        .single();

      if (payments.data) {
        // Update payment status
        await PaymentService.updatePaymentStatus(payments.data.id, 'completed', paymentId);
        
        // Update booking status
        await DatabaseService.updateBookingStatus(payments.data.booking_id, 'confirmed', 'system');
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// PayPal webhook
router.post('/paypal/webhook', async (req, res) => {
  try {
    const { 
      resource_type, 
      resource: { 
        id, 
        state, 
        transactions 
      } 
    } = req.body;

    if (resource_type === 'payment' && state === 'approved') {
      // Find payment by transaction ID
      const payments = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', id)
        .single();

      if (payments.data) {
        // Update payment status
        await PaymentService.updatePaymentStatus(payments.data.id, 'completed', id);
        
        // Update booking status
        await DatabaseService.updateBookingStatus(payments.data.booking_id, 'confirmed', 'system');
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Paytm webhook
router.post('/paytm/webhook', async (req, res) => {
  try {
    const { 
      ORDERID, 
      TXNID, 
      TXNAMOUNT, 
      STATUS, 
      CHECKSUMHASH 
    } = req.body;

    if (STATUS === 'TXN_SUCCESS') {
      // Find payment by transaction ID
      const payments = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', ORDERID)
        .single();

      if (payments.data) {
        // Update payment status
        await PaymentService.updatePaymentStatus(payments.data.id, 'completed', TXNID);
        
        // Update booking status
        await DatabaseService.updateBookingStatus(payments.data.booking_id, 'confirmed', 'system');
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Paytm webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Create Order
router.post("/create-order", async (req: any, res: any) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// Verify Payment
router.post("/verify", (req: any, res: any) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

// Get payment details
router.get('/:paymentId', [
  param('paymentId').notEmpty().withMessage('Payment ID is required')
], validate, async (req: any, res: any): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const userId = (req.user as any)?.id;

    // Get payment details with booking info
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings (
          id,
          parent_id,
          status,
          class_level,
          subjects,
          scheduled_date
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    // Check if user owns this payment
    if (payment.bookings.parent_id !== userId && (req.user as any)?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user's payment history
router.get('/my/payments', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings (
          id,
          status,
          class_level,
          subjects,
          scheduled_date,
          duration_minutes
        )
      `)
      .eq('bookings.parent_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments' });
      return;
    }

    res.json({
      success: true,
      data: payments || []
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
