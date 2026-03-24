import express from "express";
import { PaymentService } from "../services/paymentService";

const router = express.Router();

// Mock Payment Route (Bypass Razorpay issues)
router.post("/mock-payment", async (req: any, res: any) => {
  try {
    console.log('🔧 Using mock payment mode...');
    const { amount, customerInfo } = req.body;
    
    // Simulate payment processing
    const mockResponse = {
      success: true,
      paymentId: 'mock_pay_' + Date.now(),
      orderId: 'mock_order_' + Date.now(),
      transactionId: 'mock_txn_' + Math.random().toString(36).substr(2, 9),
      key: 'mock_key',
      message: 'Mock payment successful - proceed with booking'
    };
    
    console.log('✅ Mock payment created:', mockResponse);
    res.json(mockResponse);
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ error: "Mock payment failed" });
  }
});

// Mock Verify Route
router.post("/mock-verify", async (req: any, res: any) => {
  try {
    console.log('🔧 Mock payment verification...');
    const { paymentId, orderId, transactionId } = req.body;
    
    const mockVerification = {
      success: true,
      verified: true,
      transactionId: transactionId || 'mock_txn_verified',
      message: 'Mock payment verified - booking confirmed'
    };
    
    console.log('✅ Mock payment verified:', mockVerification);
    res.json(mockVerification);
  } catch (error) {
    console.error('Mock verification error:', error);
    res.status(500).json({ error: "Mock verification failed" });
  }
});

// Simple Create Order Route
router.post("/create-order", async (req: any, res: any) => {
  try {
    const { amount } = req.body;

    const order = await PaymentService.createOrder(amount);

    res.json({
      ...order,
      key: process.env.RAZORPAY_KEY_ID // Send key to frontend
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: "Payment failed" });
  }
});

// Simple Verify Route
router.post("/verify", (req: any, res: any) => {
  PaymentService.verifyPayment(req, res);
});

export default router;
