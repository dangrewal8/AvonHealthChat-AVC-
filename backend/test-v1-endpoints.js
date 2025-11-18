/**
 * Test v1 endpoints since token audience is https://api.avonhealth.com/v1/
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const USER_ID = process.env.AVON_USER_ID;

console.log('\n🧪 Testing V1 Endpoints (Token audience is /v1/)');
console.log('='.repeat(80));

async function testV1Endpoints() {
  try {
    // Get access token
    console.log('🔐 Obtaining access token...');
    const tokenResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Token obtained\n');

    // Test v1 endpoints
    const v1Endpoints = [
      '/v1/care_plans',
      '/v1/medications',
      '/v1/notes',
      '/v1/patients',
      '/v1/users',
      '/v1/users/me',
      '/v1/profile',
      '/v1/health',
      `/v1/care_plans?patient_id=${USER_ID}`,
      `/v1/medications?patient_id=${USER_ID}`,
      `/v1/notes?patient_id=${USER_ID}`,
    ];

    console.log('Testing v1 endpoints:\n');
    const results = [];

    for (const endpoint of v1Endpoints) {
      process.stdout.write(`  ${endpoint.padEnd(50)} ... `);
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });

        console.log(`✅ ${response.status}`);
        results.push({
          endpoint,
          status: response.status,
          success: true,
          dataType: Array.isArray(response.data) ? 'Array' : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : null,
          sample: JSON.stringify(response.data).substring(0, 100),
        });
      } catch (error) {
        const status = error.response?.status || 'ERROR';
        const statusIcon = status === 404 ? '❌' : status === 401 ? '🔒' : '⚠️';
        console.log(`${statusIcon} ${status}`);
        results.push({
          endpoint,
          status,
          success: false,
          error: error.response?.data?.message || error.message,
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(80));

    const successful = results.filter(r => r.success);
    const notFound = results.filter(r => r.status === 404);
    const unauthorized = results.filter(r => r.status === 401);
    const serverErrors = results.filter(r => r.status >= 500);

    console.log(`\n✅ Successful: ${successful.length}`);
    console.log(`❌ Not Found (404): ${notFound.length}`);
    console.log(`🔒 Unauthorized (401): ${unauthorized.length}`);
    console.log(`⚠️  Server Errors (5xx): ${serverErrors.length}`);

    if (successful.length > 0) {
      console.log('\n✅ WORKING ENDPOINTS:');
      successful.forEach(r => {
        console.log(`\n   ${r.endpoint}`);
        console.log(`   Type: ${r.dataType}${r.dataLength !== null ? `, Count: ${r.dataLength}` : ''}`);
        console.log(`   Sample: ${r.sample}...`);
      });

      console.log('\n🎉 SUCCESS! Found working endpoints!');
      console.log('   Update backend to use these v1 endpoints.');
    } else {
      console.log('\n⚠️  No working endpoints found.');
      console.log('   Possible issues:');
      console.log('   1. Permissions not configured for this client ID');
      console.log('   2. Demo environment might not have data');
      console.log('   3. Endpoints might require additional parameters');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testV1Endpoints();
