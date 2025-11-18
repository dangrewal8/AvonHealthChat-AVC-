/**
 * Quick authentication test script
 * Tests the two-step JWT authentication flow with real credentials
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const ACCOUNT = process.env.AVON_ACCOUNT;
const USER_ID = process.env.AVON_USER_ID;

async function testAuthentication() {
  console.log('\n🧪 Testing Avon Health API Authentication');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Account: ${ACCOUNT}`);
  console.log(`User ID: ${USER_ID}`);
  console.log(`Client ID: ${CLIENT_ID?.substring(0, 10)}...`);
  console.log('='.repeat(80));

  if (!CLIENT_ID || !CLIENT_SECRET || !ACCOUNT || !USER_ID) {
    console.error('\n❌ ERROR: Missing required environment variables!');
    console.error('   Required: AVON_CLIENT_ID, AVON_CLIENT_SECRET, AVON_ACCOUNT, AVON_USER_ID');
    process.exit(1);
  }

  try {
    // Step 1: Get OAuth2 Bearer Token
    console.log('\n🔐 Step 1: Obtaining OAuth2 bearer token...');
    const tokenResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const bearerToken = tokenResponse.data.access_token;
    console.log('✅ Bearer token obtained successfully');
    console.log(`   Token: ${bearerToken.substring(0, 20)}...`);
    console.log(`   Expires in: ${tokenResponse.data.expires_in} seconds`);

    // Step 2: Exchange for JWT Token
    console.log('\n🔐 Step 2: Exchanging bearer token for JWT token...');
    const jwtResponse = await axios.post(
      `${BASE_URL}/v2/auth/jwt`,
      {
        account: ACCOUNT,
        user_id: USER_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const jwtToken = jwtResponse.data.jwt_token;
    console.log('✅ JWT token obtained successfully');
    console.log(`   Token: ${jwtToken.substring(0, 20)}...`);
    console.log(`   Expires in: ${jwtResponse.data.expires_in} seconds`);

    // Step 3: Test EMR Endpoint with different patient_id formats
    console.log('\n🔍 Step 3: Testing EMR endpoints with different patient_id formats...');
    console.log('='.repeat(80));

    const testPatterns = [
      { name: 'user_id as-is', id: USER_ID },
      { name: 'numeric only', id: USER_ID.replace(/\D/g, '') },
      { name: 'patient_ prefix', id: `patient_${USER_ID}` },
      { name: 'user_ prefix', id: `user_${USER_ID}` },
    ];

    let successFound = false;
    for (const pattern of testPatterns) {
      try {
        console.log(`\n   Testing: ${pattern.name}`);
        console.log(`   patient_id: ${pattern.id}`);

        const carePlansResponse = await axios.get(
          `${BASE_URL}/v2/care_plans?patient_id=${pattern.id}`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`   ✅ SUCCESS with ${pattern.name}!`);
        console.log(`   Status: ${carePlansResponse.status}`);
        console.log(`   Data: ${JSON.stringify(carePlansResponse.data).substring(0, 100)}...`);
        console.log(`\n   ⭐ USE THIS PATIENT_ID FORMAT: ${pattern.id}`);
        successFound = true;
        break; // Stop on first success
      } catch (error) {
        console.log(`   ❌ Failed with ${pattern.name}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Message: ${error.response.data?.message || error.message}`);
        } else {
          console.log(`   Error: ${error.message}`);
        }
      }
    }

    if (!successFound) {
      console.log('\n⚠️  All patient_id patterns failed!');
      console.log('   Possible issues:');
      console.log('   1. User does not have patient data in the system');
      console.log('   2. Different patient_id format required (check API docs)');
      console.log('   3. Permissions issue with the account');
      console.log('\n   Next steps:');
      console.log('   - Check Avon Health API documentation for patient_id format');
      console.log('   - Contact Avon Health support for correct patient_id');
      console.log('   - Verify the user has access to patient data');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 Authentication test completed!');
    console.log('='.repeat(80));

    if (successFound) {
      console.log('\n✅ RESULT: Authentication fully working!');
      console.log('   The backend can now communicate with Avon Health API.');
    } else {
      console.log('\n⚠️  RESULT: Authentication works, but patient data access needs debugging.');
      console.log('   OAuth2 + JWT tokens obtained successfully.');
      console.log('   Check patient_id format or contact Avon Health support.');
    }

  } catch (error) {
    console.error('\n❌ AUTHENTICATION FAILED');
    console.error('='.repeat(80));

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data?.message || error.message}`);
      console.error(`Details:`, error.response.data);

      if (error.response.status === 401 || error.response.status === 403) {
        console.error('\n💡 Possible causes:');
        console.error('   1. Invalid CLIENT_ID or CLIENT_SECRET');
        console.error('   2. Invalid ACCOUNT or USER_ID');
        console.error('   3. Credentials expired or revoked');
        console.error('\n   Action: Verify credentials in .env file');
      }
    } else {
      console.error(`Error: ${error.message}`);

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('\n💡 Network issue:');
        console.error('   - Check internet connection');
        console.error('   - Verify BASE_URL is correct');
        console.error(`   - Current URL: ${BASE_URL}`);
      }
    }

    process.exit(1);
  }
}

// Run the test
testAuthentication();
