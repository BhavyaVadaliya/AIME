import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as any }
});

async function test() {
  try {
    const { data, error, status } = await supabase
      .from('signals')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Connection Failed:', error.message);
      console.error('Status Code:', status);
    } else {
      console.log('Connection Successful!');
      console.log('Signals in table:', data.length);
      console.log('Table exists and is readable.');
    }
  } catch (e: any) {
    console.error('Unexpected Error:', e.message);
  }
}

test();
