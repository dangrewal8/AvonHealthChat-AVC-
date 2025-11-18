/**
 * Test Avon Health API with different header combinations
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const USER_ID = process.env.AVON_USER_ID;
const ACCOUNT = process.env.AVON_ACCOUNT;

console.log('\n🧪 Testing Avon Health API with Different Headers');
console.log('='.repeat(80));

async function testWithHeaders() {
  try {
    // Get token
    console.log('🔐 Getting access token...');
    const tokenResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const token = tokenResponse.data.access_token;
    console.log('✅ Token obtained\n');

    // Try different header combinations
    const headerCombinations = [
      {
        name: 'Bearer only',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
      {
        name: 'Bearer + Account header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Account': ACCOUNT,
        },
      },
      {
        name: 'Bearer + Account + User headers',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Account': ACCOUNT,
          'X-User-ID': USER_ID,
        },
      },
      {
        name: 'Bearer + Avon-Account header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Avon-Account': ACCOUNT,
        },
      },
      {
        name: 'Bearer + Account-ID header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Account-ID': ACCOUNT,
        },
      },
      {
        name: 'Bearer + X-Tenant header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant': ACCOUNT,
        },
      },
    ];

    const endpoints = [
      '/v1/care_plans',
      '/v2/care_plans',
      '/v1/medications',
      '/v2/medications',
      '/v1/notes',
      '/v2/notes',
      '/v1/patients',
      '/v2/patients',
    ];

    console.log('Testing combinations...\n');

    for (const endpoint of endpoints) {
      for (const combo of headerCombinations) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: combo.headers,
            timeout: 5000,
          });

          console.log(`\n✅ SUCCESS: ${endpoint} with ${combo.name}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Data type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
          if (Array.isArray(response.data)) {
            console.log(`   Count: ${response.data.length}`);
            if (response.data.length > 0) {
              console.log(`   Sample: ${JSON.stringify(response.data[0]).substring(0, 150)}...`);
            }
          }
          console.log(`   Headers used: ${JSON.stringify(combo.headers, null, 2)}`);

        } catch (error) {
          const status = error.response?.status;
          if (status && status !== 404 && status !== 401) {
            const errorMsg = error.response?.data?.message || error.message;
            console.log(`   ${endpoint} with ${combo.name}: ${status} - ${errorMsg.substring(0, 100)}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('Test completed');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testWithHeaders();
