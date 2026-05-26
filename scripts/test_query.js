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

  const BOOKING_SELECT_MINIMAL = `
    id,
    vehicle_id,
    user_id,
    pickup_date,
    return_date,
    pickup_location,
    return_location,
    rental_days,
    subtotal_rupees,
    total_rupees,
    booking_status,
    payment_status,
    created_at,
    updated_at
  `.trim();

  // payment_received_by and deposit_status removed
  const BOOKING_SELECT_OPERATIONAL = `
    ${BOOKING_SELECT_MINIMAL},
    price_per_day_rupees_snapshot,
    convenience_fee_rupees,
    gst_rupees,
    payment_method,
    amount_due,
    amount_paid,
    payment_received_at,
    payment_notes,
    ops_note,
    deposit_amount,
    booking_source
  `.trim();

  const BOOKING_VEHICLE_EMBED = `
    vehicles!bookings_vehicle_id_fkey (
      id,
      name,
      brand,
      price_per_day,
      image,
      available,
      transmission,
      fuel_type,
      seats,
      year,
      registration_number,
      security_deposit
    )
  `;

  const bookingSelectWithVehicle = `
    ${BOOKING_SELECT_OPERATIONAL},
    ${BOOKING_VEHICLE_EMBED}
  `.trim();

  console.log('Querying bookings with updated vehicle embed select...');
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelectWithVehicle)
    .limit(3);

  if (error) {
    console.error('Query Failed with error:', error);
  } else {
    console.log('Query Succeeded! Sample data:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
