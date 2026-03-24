const Razorpay = require('razorpay');
require('dotenv').config();

console.log('🔍 Testing Razorpay Live Connection...');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
console.log('Key type:', process.env.RAZORPAY_KEY_ID?.startsWith('rpz_live_') ? 'LIVE' : 'TEST');

try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  // Test with different method
  razorpay.accounts.fetch().then(response => {
    console.log('✅ Razorpay Account Fetch Result:', response);
    console.log('✅ Razorpay Connected Successfully!');
    console.log('📊 Account info:', response);
  }).catch(error => {
    console.log('❌ Razorpay Account Error:', error.error);
    console.log('❌ Error Description:', error.error?.description);
    console.log('❌ Error Code:', error.error?.code);
  });

} catch (error) {
  console.log('❌ Razorpay Connection Error:', error.message);
}
