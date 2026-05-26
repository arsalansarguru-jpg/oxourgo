const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function tryPhone(phone) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  const userId = '9857150a-8d70-4b0a-b207-7979087bfb1b';

  console.log(`Trying phone format: "${phone}"`);
  const { error } = await supabase
    .from('profiles')
    .update({ phone })
    .eq('user_id', userId);

  if (error) {
    console.log(`❌ Failed: ${error.message} (${error.code})`);
    return false;
  } else {
    console.log(`✅ Success!`);
    return true;
  }
}

async function main() {
  const formats = [
    '+919876543210',
    '9876543210',
    '+91-9876543210',
    '09876543210',
    '+91 9876543210',
    '98765-43210'
  ];

  for (const fmt of formats) {
    const ok = await tryPhone(fmt);
    if (ok) {
      console.log(`Successful format found: "${fmt}"`);
      break;
    }
  }
}

main().catch(console.error);
