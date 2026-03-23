import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwnbbjvxrhjjwfshtxto.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bmJianZ4cmhqandmc2h0eHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODIwMjgsImV4cCI6MjA4ODg1ODAyOH0.43vGCUfAos1xPr0fIvDEy2mzO1ajjof42FJC1ryrq9w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('bookings').select('id, service_id, status, total_amount').limit(1);
  console.log('Bookings columns check:', error ? error.message : 'Success: table has service_id');
}

test();
