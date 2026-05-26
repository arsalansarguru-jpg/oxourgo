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

  const { data: rawBookings, error: rawError } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);

  if (rawError) {
    console.error('Raw query failed:', rawError);
    return;
  }

  const dbColumns = new Set(Object.keys(rawBookings[0]));

  const BOOKING_SELECT_MINIMAL = [
    'id', 'vehicle_id', 'user_id', 'pickup_date', 'return_date',
    'pickup_location', 'return_location', 'rental_days',
    'subtotal_rupees', 'total_rupees', 'booking_status',
    'payment_status', 'created_at', 'updated_at'
  ];

  const BOOKING_SELECT_OPERATIONAL = [
    ...BOOKING_SELECT_MINIMAL,
    'price_per_day_rupees_snapshot', 'convenience_fee_rupees',
    'gst_rupees', 'payment_method', 'amount_due', 'amount_paid',
    'payment_received_at', 'payment_received_by', 'payment_notes',
    'ops_note', 'deposit_amount', 'deposit_status', 'booking_source'
  ];

  const BOOKING_SELECT_FULL = [
    ...BOOKING_SELECT_OPERATIONAL,
    'approved_at', 'handed_over_at', 'returned_at', 'completed_at',
    'approved_by', 'handed_over_by', 'completed_by',
    'deposit_held_rupees', 'deposit_refunded_at', 'deposit_refunded_rupees',
    'deposit_received_at', 'refund_amount', 'refund_processed_at',
    'penalty_total', 'penalty_fuel_rupees', 'penalty_cleaning_rupees',
    'penalty_traffic_rupees', 'penalty_notes', 'deductions',
    'financial_manual_override', 'pickup_checklist', 'return_checklist',
    'pickup_fuel_level', 'return_fuel_level', 'pickup_odometer_km',
    'return_odometer_km', 'pickup_condition_notes', 'return_condition_notes',
    'penalty_damage_rupees', 'penalty_late_rupees', 'penalty_extra_km_rupees',
    'deposit_penalty_total_rupees', 'customer_handover_signature_path',
    'customer_handover_signed_at', 'pickup_inspection_completed_at',
    'return_inspection_completed_at', 'admin_internal_notes',
    'ops_hold_at', 'ops_hold_reason', 'vip_flag', 'customer_flags',
    'restrictions_bypass', 'custom_discount_rupees', 'customer_contact_id',
    'whatsapp_conversation_id', 'outstanding_fines_rupees'
  ];

  console.log('--- MISSING IN OPERATIONAL ---');
  BOOKING_SELECT_OPERATIONAL.forEach(col => {
    if (!dbColumns.has(col)) {
      console.log(`Column "${col}" is NOT in database.`);
    }
  });

  console.log('\n--- MISSING IN FULL ---');
  BOOKING_SELECT_FULL.forEach(col => {
    if (!dbColumns.has(col)) {
      console.log(`Column "${col}" is NOT in database.`);
    }
  });
}

main().catch(console.error);
