const Razorpay = require('razorpay');
require('dotenv').config();

console.log('🔍 Testing Real Razorpay Connection...');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);

try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  console.log('✅ Razorpay client created successfully');

  // Test creating a small order
  const options = {
    amount: 100, // ₹1 in paise
    currency: 'INR',
    receipt: 'test_receipt_' + Date.now(),
    payment_capture: 1
  };

  console.log('🔧 Creating test order...');
  
  razorpay.orders.create(options).then(order => {
    console.log('✅ Test order created successfully:', order);
    console.log('✅ Razorpay is working with your keys!');
  }).catch(error => {
    console.log('❌ Test order failed:', error.error);
    console.log('❌ Error Description:', error.error?.description);
  });

} catch (error) {
  console.log('❌ Razorpay client creation failed:', error.message);
}
