/**
 * Test different authentication endpoint patterns
 * Helps discover the correct Avon Health API endpoints
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;

console.log('\n🔍 Discovering Avon Health API Authentication Endpoints');
console.log('='.repeat(80));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Client ID: ${CLIENT_ID?.substring(0, 10)}...`);
console.log('='.repeat(80));

const OAUTH_ENDPOINTS_TO_TRY = [
  '/oauth2/token',
  '/oauth/token',
  '/v1/oauth2/token',
  '/v1/oauth/token',
  '/v2/oauth2/token',
  '/v2/oauth/token',
  '/auth/token',
  '/v1/auth/token',
  '/v2/auth/token',
  '/token',
  '/api/oauth/token',
  '/api/auth/token',
];

async function testEndpoint(endpoint) {
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      endpoint,
      status: response.status,
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      endpoint,
      status: error.response?.status || 'NETWORK_ERROR',
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

async function discoverEndpoints() {
  console.log('\nTesting OAuth2 token endpoints...\n');

  const results = [];
  for (const endpoint of OAUTH_ENDPOINTS_TO_TRY) {
    process.stdout.write(`  Testing ${endpoint.padEnd(25)} ... `);
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      console.log(`✅ SUCCESS (${result.status})`);
    } else if (result.status === 404) {
      console.log(`❌ Not Found (404)`);
    } else if (result.status === 401 || result.status === 403) {
      console.log(`⚠️  Found but auth failed (${result.status}) - might be correct endpoint!`);
    } else {
      console.log(`❌ Error (${result.status})`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('RESULTS:');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const authErrors = results.filter(r => r.status === 401 || r.status === 403);
  const notFound = results.filter(r => r.status === 404);

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL ENDPOINTS:');
    successful.forEach(r => {
      console.log(`   ${r.endpoint}`);
      console.log(`   Response: ${JSON.stringify(r.data).substring(0, 100)}...`);
    });
  }

  if (authErrors.length > 0) {
    console.log('\n⚠️  ENDPOINTS WITH AUTH ERRORS (might be correct, check credentials):');
    authErrors.forEach(r => {
      console.log(`   ${r.endpoint} - ${r.status}`);
      console.log(`   Error: ${JSON.stringify(r.error).substring(0, 100)}...`);
    });
  }

  if (notFound.length === OAUTH_ENDPOINTS_TO_TRY.length) {
    console.log('\n❌ ALL ENDPOINTS RETURNED 404');
    console.log('\nPossible issues:');
    console.log('  1. Wrong base URL');
    console.log(`     Current: ${BASE_URL}`);
    console.log('     Try checking if subdomain is correct');
    console.log('  2. API might use different authentication method');
    console.log('  3. Endpoints might require different HTTP method (GET instead of POST)');
    console.log('\nRecommendation:');
    console.log('  - Wait for docs.avonhealth.com to come back online');
    console.log('  - Contact Avon Health support for correct endpoint paths');
    console.log('  - Check if there\'s an API sandbox or testing environment');
  }

  // Try accessing base endpoints to see if API is even reachable
  console.log('\n' + '='.repeat(80));
  console.log('Testing base endpoint accessibility...\n');

  const baseTests = ['/', '/health', '/api', '/v1', '/v2'];
  for (const path of baseTests) {
    try {
      const response = await axios.get(`${BASE_URL}${path}`, { timeout: 5000 });
      console.log(`  ${path.padEnd(15)} ✅ ${response.status} - ${response.statusText}`);
    } catch (error) {
      const status = error.response?.status || 'ERROR';
      console.log(`  ${path.padEnd(15)} ${status === 404 ? '❌' : '⚠️'}  ${status}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

discoverEndpoints().catch(console.error);
