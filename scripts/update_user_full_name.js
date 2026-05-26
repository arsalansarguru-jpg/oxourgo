const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Supabase URL or Key not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const userId = '9857150a-8d70-4b0a-b207-7979087bfb1b';

  console.log('Updating profile of Arsalan Sarguru...');
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: 'Arsalan Sarguru',
      phone: '+919876543210'
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Profile update failed:', error);
  } else {
    console.log('Profile updated successfully!');
  }
}

main().catch(console.error);
