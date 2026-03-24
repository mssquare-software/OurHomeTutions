const Razorpay = require('razorpay');
require('dotenv').config();

console.log('🔍 Testing Razorpay Connection...');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);

try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  // Test Razorpay connection by fetching orders
  razorpay.orders.all({
    count: 1,
    skip: 0
  }).then(response => {
    console.log('✅ Razorpay Connection Result:', response);
    console.log('✅ Razorpay Connected Successfully!');
    console.log('📊 Orders count:', response.items?.length || 0);
  }).catch(error => {
    console.log('❌ Razorpay Error:', error.error);
    console.log('❌ Error Description:', error.error?.description);
  });

} catch (error) {
  console.log('❌ Razorpay Connection Error:', error.message);
}
