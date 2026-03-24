// Mock payment service for testing without real Razorpay
console.log('🔍 Testing Mock Payment Service...');

const createMockPayment = async (amount, customerInfo) => {
  console.log('💳 Creating mock payment...');
  console.log('Amount:', amount);
  console.log('Customer:', customerInfo);
  
  // Simulate payment processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        paymentId: 'mock_pay_' + Date.now(),
        orderId: 'mock_order_' + Date.now(),
        transactionId: 'mock_txn_' + Math.random().toString(36).substr(2, 9),
        message: 'Mock payment successful'
      });
    }, 1000);
  });
};

const verifyMockPayment = async (paymentData) => {
  console.log('🔍 Verifying mock payment...');
  console.log('Payment data:', paymentData);
  
  return {
    success: true,
    verified: true,
    transactionId: paymentData.transactionId,
    message: 'Mock payment verified'
  };
};

// Test mock payment
createMockPayment(500, {
  name: 'Test User',
  email: 'test@example.com',
  contact: '1234567890'
}).then(result => {
  console.log('✅ Mock Payment Created:', result);
  
  return verifyMockPayment(result);
}).then(verification => {
  console.log('✅ Mock Payment Verified:', verification);
  console.log('✅ Mock payment system working!');
}).catch(error => {
  console.log('❌ Mock Payment Error:', error);
});
