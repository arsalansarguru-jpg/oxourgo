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

  console.log('Querying date fields for user Arsalan Sarguru bookings...');
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, pickup_date, return_date, pickup_at, return_at')
    .eq('user_id', '9857150a-8d70-4b0a-b207-7979087bfb1b');

  if (error) {
    console.error('Query failed:', error);
  } else {
    console.log(JSON.stringify(bookings, null, 2));
  }
}

main().catch(console.error);
