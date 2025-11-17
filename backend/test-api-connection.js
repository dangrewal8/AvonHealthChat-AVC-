#!/usr/bin/env node

/**
 * Avon Health API Connection Test
 *
 * This script tests the connection to the Avon Health API to verify:
 * - API credentials are correct
 * - OAuth2 authentication works
 * - API endpoints are accessible
 * - Data can be fetched successfully
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
const environment = process.env.NODE_ENV || 'development';
const envFile = `.env.${environment}`;
console.log(`Loading configuration from: ${envFile}\n`);
dotenv.config({ path: envFile });

// Configuration
const config = {
  clientId: process.env.AVON_CLIENT_ID,
  clientSecret: process.env.AVON_CLIENT_SECRET,
  baseUrl: process.env.AVON_BASE_URL,
  account: process.env.AVON_ACCOUNT,
  userId: process.env.AVON_USER_ID,
};

// Display configuration (redact secrets)
console.log('=================================================================');
console.log('Avon Health API Connection Test');
console.log('=================================================================\n');

console.log('Configuration:');
console.log(`  Base URL:      ${config.baseUrl}`);
console.log(`  Client ID:     ${config.clientId?.substring(0, 10)}...`);
console.log(`  Client Secret: ${config.clientSecret ? '***REDACTED***' : 'NOT SET'}`);
console.log(`  Account:       ${config.account || 'NOT SET'}`);
console.log(`  User ID:       ${config.userId?.substring(0, 20)}... `);
console.log('');

// Validate configuration
if (!config.clientId || !config.clientSecret || !config.baseUrl) {
  console.error('❌ ERROR: Missing required configuration!');
  console.error('   Please check your .env file contains:');
  console.error('   - AVON_CLIENT_ID');
  console.error('   - AVON_CLIENT_SECRET');
  console.error('   - AVON_BASE_URL');
  process.exit(1);
}

// Test functions
async function testOAuthToken() {
  console.log('Step 1: Testing OAuth2 Authentication');
  console.log('-'.repeat(65));

  try {
    const tokenUrl = `${config.baseUrl}/v2/auth/token`;
    console.log(`  Requesting token from: ${tokenUrl}`);

    const response = await axios.post(
      tokenUrl,
      `client_id=${encodeURIComponent(config.clientId)}&client_secret=${encodeURIComponent(config.clientSecret)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      }
    );

    const { access_token, expires_in, token_type } = response.data;

    if (!access_token) {
      throw new Error('No access token in response');
    }

    console.log(`  ✅ Authentication successful!`);
    console.log(`  Token type:    ${token_type}`);
    console.log(`  Expires in:    ${expires_in} seconds (${Math.floor(expires_in / 60)} minutes)`);
    console.log(`  Token preview: ${access_token.substring(0, 20)}...`);
    console.log('');

    return access_token;
  } catch (error) {
    console.error(`  ❌ Authentication failed!`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Error:  ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`  Error: Connection timeout`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    console.log('');
    throw error;
  }
}

async function testJWTToken(accessToken) {
  console.log('Step 2: Getting JWT Token for User');
  console.log('-'.repeat(65));

  try {
    const jwtUrl = `${config.baseUrl}/v2/auth/get-jwt`;
    console.log(`  Requesting JWT from: ${jwtUrl}`);
    console.log(`  For user ID: ${config.userId}`);

    const response = await axios.post(
      jwtUrl,
      { id: config.userId },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const { jwt } = response.data;

    if (!jwt) {
      throw new Error('No JWT token in response');
    }

    console.log(`  ✅ JWT token acquired!`);
    console.log(`  JWT preview:   ${jwt.substring(0, 30)}...`);
    console.log('');

    return jwt;
  } catch (error) {
    console.error(`  ❌ JWT token request failed!`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Error:  ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`  Error: Connection timeout`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    console.log('');
    throw error;
  }
}

async function testAPIEndpoint(accessToken, jwt, endpoint, description, patientId) {
  console.log(`Step ${endpoint === '/v2/care_plans' ? '4' : endpoint === '/v2/medications' ? '5' : '6'}: Testing ${description}`);
  console.log('-'.repeat(65));

  try {
    const url = `${config.baseUrl}${endpoint}`;
    console.log(`  Fetching from: ${url}`);

    const params = {};
    // Use patient parameter if provided
    if (patientId) {
      params.patient = patientId;
      console.log(`  Filtering by patient: ${patientId}`);
    }

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-jwt': jwt,
        'account': config.account,
        'Content-Type': 'application/json',
      },
      params,
      timeout: 15000,
    });

    console.log(`  ✅ Request successful!`);
    console.log(`  Status:        ${response.status} ${response.statusText}`);

    if (Array.isArray(response.data)) {
      console.log(`  Items found:   ${response.data.length}`);
      if (response.data.length > 0) {
        console.log(`  First item ID: ${response.data[0].id || 'N/A'}`);
        console.log(`  Sample keys:   ${Object.keys(response.data[0]).slice(0, 5).join(', ')}`);
      }
    } else if (response.data && typeof response.data === 'object') {
      console.log(`  Response keys: ${Object.keys(response.data).slice(0, 5).join(', ')}`);
    }

    console.log('');
    return response.data;
  } catch (error) {
    console.error(`  ❌ Request failed!`);
    if (error.response) {
      console.error(`  Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`  Error:  ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    console.log('');
    return null;
  }
}

async function runTests() {
  try {
    // Step 1: Get OAuth token
    const accessToken = await testOAuthToken();

    // Step 2: Get JWT token
    const jwt = await testJWTToken(accessToken);

    // Step 3: Get Patients list
    const patients = await testAPIEndpoint(
      accessToken,
      jwt,
      '/v2/patients',
      'Patients Endpoint'
    );

    if (!patients || !Array.isArray(patients.data) || patients.data.length === 0) {
      console.log('⚠️  No patients found in account. Cannot test data endpoints.');
      return;
    }

    const patientId = patients.data[0].id;
    const patientName = `${patients.data[0].first_name} ${patients.data[0].last_name}`;
    console.log(`Using patient: ${patientName} (${patientId})\n`);

    // Step 4: Test Care Plans endpoint
    const carePlans = await testAPIEndpoint(
      accessToken,
      jwt,
      '/v2/care_plans',
      'Care Plans Endpoint',
      patientId
    );

    // Step 5: Test Medications endpoint
    const medications = await testAPIEndpoint(
      accessToken,
      jwt,
      '/v2/medications',
      'Medications Endpoint',
      patientId
    );

    // Step 6: Test Notes endpoint
    const notes = await testAPIEndpoint(
      accessToken,
      jwt,
      '/v2/notes',
      'Notes Endpoint',
      patientId
    );

    // Summary
    console.log('=================================================================');
    console.log('Test Summary');
    console.log('=================================================================\n');

    console.log('✅ OAuth2 Authentication:  PASSED');
    console.log('✅ JWT Token:              PASSED');
    console.log(`${patients ? '✅' : '❌'} Patients Endpoint:      ${patients ? 'PASSED' : 'FAILED'}`);
    console.log(`${carePlans ? '✅' : '❌'} Care Plans Endpoint:     ${carePlans ? 'PASSED' : 'FAILED'}`);
    console.log(`${medications ? '✅' : '❌'} Medications Endpoint:   ${medications ? 'PASSED' : 'FAILED'}`);
    console.log(`${notes ? '✅' : '❌'} Notes Endpoint:         ${notes ? 'PASSED' : 'FAILED'}`);

    console.log('');

    const totalItems = (
      (Array.isArray(patients?.data) ? patients.data.length : 0) +
      (Array.isArray(carePlans?.data) ? carePlans.data.length : 0) +
      (Array.isArray(medications?.data) ? medications.data.length : 0) +
      (Array.isArray(notes?.data) ? notes.data.length : 0)
    );

    console.log(`Total items accessible: ${totalItems}`);
    console.log('');

    if (patients && carePlans && medications && notes) {
      console.log('🎉 All API tests PASSED! Your Avon Health API connection is working.');
      console.log('');
      process.exit(0);
    } else {
      console.log('⚠️  Some API endpoints failed. Check the errors above.');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.log('=================================================================');
    console.log('Test Summary');
    console.log('=================================================================\n');
    console.log('❌ API connection test FAILED');
    console.log('');
    console.log('Please verify:');
    console.log('  1. Your .env file has correct AVON_CLIENT_ID and AVON_CLIENT_SECRET');
    console.log('  2. The Avon Health API is accessible from your network');
    console.log('  3. Your credentials have the necessary permissions');
    console.log('');
    process.exit(1);
  }
}

// Run tests
runTests();
