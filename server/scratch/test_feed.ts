import "dotenv/config";
import axios from 'axios';

const CORE_API_URL = 'https://aime-0vwz.onrender.com/api';

async function test() {
  console.log('Fetching signals from:', `${CORE_API_URL}/admin/governance/signals`);
  try {
    const res = await axios.get(`${CORE_API_URL}/admin/governance/signals`);
    console.log('Status:', res.status);
    console.log('Signals received:', res.data.length);
    if (res.data.length > 0) {
      console.log('First signal structure:', JSON.stringify(res.data[0], null, 2));
    }
  } catch (e: any) {
    console.error('Fetch failed:', e.message);
  }
}

test();
