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

  console.log('Querying all bookings in the database...');
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, user_id, pickup_date, return_date, booking_status, total_rupees, pickup_location, return_location')
    .limit(10);

  if (error) {
    console.error('Query failed:', error);
  } else {
    console.log(`Found ${bookings.length} bookings:`);
    console.log(JSON.stringify(bookings, null, 2));
  }
}

main().catch(console.error);
