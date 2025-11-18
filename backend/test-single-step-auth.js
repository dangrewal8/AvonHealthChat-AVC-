/**
 * Test single-step authentication (no JWT exchange)
 * Use the bearer token directly for EMR endpoints
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const USER_ID = process.env.AVON_USER_ID;

console.log('\n🧪 Testing Single-Step Authentication (Bearer Token Only)');
console.log('='.repeat(80));
console.log(`Base URL: ${BASE_URL}`);
console.log(`User ID: ${USER_ID}`);
console.log('='.repeat(80));

async function testSingleStepAuth() {
  try {
    // Step 1: Get Access Token
    console.log('\n🔐 Step 1: Obtaining access token...');
    const tokenResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained successfully');
    console.log(`   Token: ${accessToken.substring(0, 20)}...`);
    console.log(`   Expires in: ${tokenResponse.data.expires_in} seconds`);

    // Step 2: Test EMR endpoints directly with bearer token
    console.log('\n🔍 Step 2: Testing EMR endpoints with bearer token...');
    console.log('='.repeat(80));

    const testPatterns = [
      { name: 'user_id as-is', id: USER_ID },
      { name: 'numeric only', id: USER_ID.replace(/\D/g, '') },
      { name: 'no patient_id param', id: null },
    ];

    let successFound = false;
    for (const pattern of testPatterns) {
      try {
        console.log(`\n   Testing: ${pattern.name}`);
        const endpoint = pattern.id
          ? `/v2/care_plans?patient_id=${pattern.id}`
          : `/v2/care_plans`;
        console.log(`   Endpoint: ${endpoint}`);

        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`   ✅ SUCCESS!`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data type: ${Array.isArray(response.data) ? 'Array' : 'Object'}`);
        if (Array.isArray(response.data)) {
          console.log(`   Number of care plans: ${response.data.length}`);
          if (response.data.length > 0) {
            console.log(`   Sample data: ${JSON.stringify(response.data[0]).substring(0, 150)}...`);
          }
        } else {
          console.log(`   Data: ${JSON.stringify(response.data).substring(0, 150)}...`);
        }
        console.log(`\n   ⭐ WORKING PATTERN: ${pattern.name}`);
        if (pattern.id) {
          console.log(`   ⭐ USE PATIENT_ID: ${pattern.id}`);
        } else {
          console.log(`   ⭐ NO PATIENT_ID PARAM NEEDED (token contains user context)`);
        }
        successFound = true;
        break;
      } catch (error) {
        console.log(`   ❌ Failed`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Message: ${error.response.data?.message || error.message}`);
        } else {
          console.log(`   Error: ${error.message}`);
        }
      }
    }

    if (!successFound) {
      console.log('\n⚠️  All patterns failed!');
      console.log('   Trying to list available endpoints...\n');

      // Try common endpoint patterns
      const endpointsToTry = [
        '/v2/patients',
        '/v2/users/me',
        '/v2/profile',
        '/v1/care_plans',
        '/v1/patients',
      ];

      for (const endpoint of endpointsToTry) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
          console.log(`      Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (error) {
          const status = error.response?.status || 'ERROR';
          console.log(`   ${status === 404 ? '❌' : '⚠️'}  ${endpoint} - ${status}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 TEST COMPLETED');
    console.log('='.repeat(80));

    if (successFound) {
      console.log('\n✅ RESULT: Single-step authentication WORKS!');
      console.log('   The system should use the bearer token directly for all API calls.');
      console.log('   NO JWT exchange step is needed.');
    } else {
      console.log('\n⚠️  RESULT: Authentication works, but EMR endpoint access needs investigation.');
      console.log('   Token obtained successfully, but patient data endpoints return errors.');
      console.log('\n   Recommendations:');
      console.log('   1. Check Avon Health API documentation for correct endpoint paths');
      console.log('   2. Verify the user has permissions to access patient data');
      console.log('   3. Contact Avon Health support for endpoint details');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Details:`, error.response.data);
    }
    process.exit(1);
  }
}

testSingleStepAuth();
