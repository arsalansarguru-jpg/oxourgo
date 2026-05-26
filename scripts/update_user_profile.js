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
  const { error: pErr } = await supabase
    .from('profiles')
    .update({
      full_name: 'Arsalan Sarguru',
      phone: '+91 98765 43210'
    })
    .eq('user_id', userId);

  if (pErr) {
    console.error('Profile update failed:', pErr);
  } else {
    console.log('Profile updated successfully!');
  }

  console.log('Fetching all bookings for user Arsalan Sarguru...');
  const { data: bookings, error: fErr } = await supabase
    .from('bookings')
    .select('id, amount_due')
    .eq('user_id', userId);

  if (fErr) {
    console.error('Fetching bookings failed:', fErr);
    return;
  }

  console.log(`Updating ${bookings.length} bookings...`);
  for (const b of bookings) {
    console.log(`Updating booking ${b.id}...`);
    const { error: bErr } = await supabase
      .from('bookings')
      .update({
        booking_status: 'pending_payment',
        payment_status: 'pending',
        total_rupees: b.amount_due,
        pickup_location: 'Mira Road Hub',
        return_location: 'Mira Road Hub'
      })
      .eq('id', b.id);

    if (bErr) {
      console.error(`Booking ${b.id} update failed:`, bErr);
    } else {
      console.log(`Booking ${b.id} updated successfully.`);
    }
  }
}

main().catch(console.error);
