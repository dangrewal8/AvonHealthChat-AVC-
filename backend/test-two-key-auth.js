/**
 * Test TWO-KEY Authentication
 * Tests the correct authentication flow discovered in documentation
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const USER_ID = process.env.AVON_USER_ID;
const ACCOUNT = process.env.AVON_ACCOUNT;

console.log('\n🔐 TWO-KEY AUTHENTICATION TEST');
console.log('='.repeat(80));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Account: ${ACCOUNT}`);
console.log(`User ID: ${USER_ID}`);
console.log('='.repeat(80));

async function testTwoKeyAuth() {
  try {
    // Step 1: Get Bearer Token (Organization-level)
    console.log('\n🔐 Step 1: Getting Bearer Token (organization-level)...');
    const bearerResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const bearerToken = bearerResponse.data.access_token;
    console.log('✅ Bearer token obtained');
    console.log(`   Token: ${bearerToken.substring(0, 30)}...`);
    console.log(`   Expires in: ${bearerResponse.data.expires_in} seconds`);

    // Step 2: Get JWT Token (User-level)
    console.log('\n🔐 Step 2: Getting JWT Token (user-level)...');
    console.log(`   User ID: ${USER_ID}`);

    const jwtResponse = await axios.post(
      `${BASE_URL}/v2/auth/get-jwt`,
      { id: USER_ID },
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const jwtToken = jwtResponse.data.jwt;
    console.log('✅ JWT token obtained');
    console.log(`   Token: ${jwtToken.substring(0, 30)}...`);

    // Step 3: Test EMR endpoints with BOTH tokens
    console.log('\n📡 Step 3: Testing EMR endpoints with TWO-KEY authentication...');
    console.log('='.repeat(80));

    const headers = {
      Authorization: `Bearer ${bearerToken}`,
      'x-jwt': jwtToken,
      'Content-Type': 'application/json',
      account: ACCOUNT, // For sandbox
    };

    console.log('\nHeaders being used:');
    console.log(`  Authorization: Bearer ${bearerToken.substring(0, 20)}...`);
    console.log(`  x-jwt: ${jwtToken.substring(0, 20)}...`);
    console.log(`  account: ${ACCOUNT}`);

    const endpoints = [
      '/v2/care_plans',
      '/v2/medications',
      '/v2/notes',
      '/v2/patients',
      '/v1/care_plans',
      '/v1/medications',
      '/v1/notes',
    ];

    let successCount = 0;
    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n  Testing: ${endpoint}`);
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers,
          timeout: 10000,
        });

        console.log(`  ✅ SUCCESS - Status: ${response.status}`);
        console.log(`     Data type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);

        if (Array.isArray(response.data)) {
          console.log(`     Count: ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log(`     Sample keys: ${Object.keys(response.data[0]).join(', ')}`);
            console.log(`     Sample data: ${JSON.stringify(response.data[0]).substring(0, 150)}...`);
          } else {
            console.log(`     Note: Empty array - no data for this user`);
          }
        } else if (typeof response.data === 'object') {
          console.log(`     Keys: ${Object.keys(response.data).join(', ')}`);
        }

        successCount++;
        results.push({
          endpoint,
          status: 'SUCCESS',
          data: response.data,
        });

      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        console.log(`  ❌ FAILED - Status: ${status}`);
        console.log(`     Error: ${message.substring(0, 100)}`);

        results.push({
          endpoint,
          status: 'FAILED',
          error: { status, message },
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(80));

    console.log(`\n✅ Successful endpoints: ${successCount}/${endpoints.length}`);

    const successful = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status === 'FAILED');

    if (successful.length > 0) {
      console.log('\n🎉 WORKING ENDPOINTS:');
      successful.forEach(r => {
        console.log(`   ✅ ${r.endpoint}`);
      });

      // Save first successful result for inspection
      const fs = require('fs');
      fs.writeFileSync(
        'two-key-auth-success.json',
        JSON.stringify(successful, null, 2)
      );
      console.log('\n💾 Success data saved to: two-key-auth-success.json');
    }

    if (failed.length > 0) {
      console.log('\n❌ FAILED ENDPOINTS:');
      failed.forEach(r => {
        console.log(`   ${r.endpoint}: ${r.error.status} - ${r.error.message.substring(0, 50)}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    if (successCount > 0) {
      console.log('✅ TWO-KEY AUTHENTICATION IS WORKING!');
      console.log('   The backend is now correctly configured to pull real data.');
    } else {
      console.log('⚠️  TWO-KEY authentication succeeded, but endpoints still failing.');
      console.log('   This may indicate:');
      console.log('   1. User has no data in the system');
      console.log('   2. Endpoints require different parameters');
      console.log('   3. User permissions issue');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ TWO-KEY AUTHENTICATION TEST FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }

    if (error.config && error.config.url) {
      console.error(`Failed at: ${error.config.method.toUpperCase()} ${error.config.url}`);
    }

    process.exit(1);
  }
}

testTwoKeyAuth();
