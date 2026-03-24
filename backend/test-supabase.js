const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

supabase.from('users').select('count').then(result => {
  console.log('✅ Supabase Connection Result:', result);
  if (result.error) {
    console.log('❌ Supabase Error:', result.error);
  } else {
    console.log('✅ Supabase Connected Successfully!');
    console.log('📊 Users count:', result.data?.[0]?.count || 0);
  }
}).catch(error => {
  console.log('❌ Supabase Connection Error:', error.message);
});
