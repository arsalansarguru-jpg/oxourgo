/* eslint-disable */
// C:\Users\DELL\.gemini\antigravity\brain\0e2aa819-bcd0-458c-846f-861fa4345ab3\scratch\test_vehicles.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('c:/Users/DELL/Desktop/oxourgo/frontend/.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const k = trimmed.substring(0, idx).trim();
    let v = trimmed.substring(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.substring(1, v.length - 1);
    }
    env[k] = v;
  });

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Supabase URL or Key not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('Fetching bookings...');
  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('id, vehicle_id, booking_status')
    .limit(10);

  if (bErr) {
    console.error('Bookings error:', bErr);
    return;
  }

  console.log(`Found ${bookings.length} bookings.`);
  const vehicleIds = bookings.map(b => b.vehicle_id);
  console.log('Vehicle IDs in bookings:', vehicleIds);

  console.log('Fetching all active vehicles...');
  const { data: vehicles, error: vErr } = await supabase
    .from('vehicles')
    .select('id, name, brand, deleted_at');

  if (vErr) {
    console.error('Vehicles error:', vErr);
    return;
  }

  console.log(`Found ${vehicles.length} vehicles in database.`);
  vehicles.forEach(v => {
    console.log(`Vehicle in DB: ID=${v.id}, Brand=${v.brand}, Name=${v.name}, Deleted=${v.deleted_at}`);
  });

  console.log('\nMatching bookings to vehicles:');
  bookings.forEach(b => {
    const match = vehicles.find(v => v.id === b.vehicle_id);
    console.log(`Booking ID=${b.id.slice(0,8)}... Vehicle_ID=${b.vehicle_id} -> Match Found: ${match ? `${match.brand} ${match.name}` : 'NONE'}`);
  });
}

main().catch(console.error);
