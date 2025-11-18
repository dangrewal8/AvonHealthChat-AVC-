/**
 * Comprehensive Avon Health API Test
 * Tests all possible endpoint combinations to find working data retrieval
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const USER_ID = process.env.AVON_USER_ID;
const ACCOUNT = process.env.AVON_ACCOUNT;

console.log('\n🔬 COMPREHENSIVE AVON HEALTH API TEST');
console.log('='.repeat(80));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Account: ${ACCOUNT}`);
console.log(`User ID: ${USER_ID}`);
console.log('='.repeat(80));

async function comprehensiveTest() {
  try {
    // Step 1: Get access token
    console.log('\n🔐 Step 1: Getting access token...');
    const tokenResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const token = tokenResponse.data.access_token;
    console.log('✅ Token obtained');

    // Step 2: Try ALL possible endpoint combinations
    console.log('\n📡 Step 2: Testing all endpoint combinations...\n');

    const versions = ['', '/v1', '/v2'];
    const resources = ['care_plans', 'medications', 'notes', 'patients', 'patient', 'users', 'user', 'emr'];
    const patientParams = [
      '',
      `?patient_id=${USER_ID}`,
      `?user_id=${USER_ID}`,
      `?id=${USER_ID}`,
      `?account=${ACCOUNT}`,
      `?account=${ACCOUNT}&user_id=${USER_ID}`,
      `/${USER_ID}`,
      `/account/${ACCOUNT}`,
      `/account/${ACCOUNT}/patient/${USER_ID}`,
    ];

    const results = [];
    let successCount = 0;

    for (const version of versions) {
      for (const resource of resources) {
        for (const params of patientParams) {
          const endpoint = `${version}/${resource}${params}`;

          try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            });

            // SUCCESS!
            console.log(`\n✅ SUCCESS: ${endpoint}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Data type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);

            if (Array.isArray(response.data)) {
              console.log(`   Count: ${response.data.length} items`);
              if (response.data.length > 0) {
                console.log(`   Sample keys: ${Object.keys(response.data[0]).join(', ')}`);
                console.log(`   Sample data: ${JSON.stringify(response.data[0]).substring(0, 200)}...`);
              }
            } else if (typeof response.data === 'object') {
              console.log(`   Keys: ${Object.keys(response.data).join(', ')}`);
              console.log(`   Sample: ${JSON.stringify(response.data).substring(0, 200)}...`);
            }

            results.push({
              endpoint,
              status: 'SUCCESS',
              code: response.status,
              dataType: Array.isArray(response.data) ? 'Array' : typeof response.data,
              count: Array.isArray(response.data) ? response.data.length : null,
              data: response.data,
            });
            successCount++;

          } catch (error) {
            const status = error.response?.status;

            // Only log non-404 errors
            if (status && status !== 404) {
              results.push({
                endpoint,
                status: 'ERROR',
                code: status,
                error: error.response?.data?.message || error.message,
              });

              if (status !== 401 && status !== 403) {
                console.log(`   ⚠️  ${endpoint} - ${status}`);
              }
            }
          }
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const successful = results.filter(r => r.status === 'SUCCESS');
    const errors = results.filter(r => r.status === 'ERROR');

    console.log(`\n✅ Successful Endpoints: ${successful.length}`);
    console.log(`❌ Error Endpoints (non-404): ${errors.length}`);

    if (successful.length > 0) {
      console.log('\n🎉 WORKING ENDPOINTS FOUND:');
      console.log('='.repeat(80));

      successful.forEach(r => {
        console.log(`\n📍 ${r.endpoint}`);
        console.log(`   Type: ${r.dataType}${r.count !== null ? `, Count: ${r.count}` : ''}`);

        if (r.dataType === 'Array' && r.count > 0) {
          console.log(`   Fields: ${Object.keys(r.data[0]).join(', ')}`);
        } else if (r.dataType === 'object') {
          console.log(`   Fields: ${Object.keys(r.data).join(', ')}`);
        }
      });

      // Save successful endpoints to file
      const fs = require('fs');
      fs.writeFileSync(
        'working-endpoints.json',
        JSON.stringify(successful, null, 2)
      );
      console.log('\n💾 Full results saved to: working-endpoints.json');

      // Generate backend configuration
      console.log('\n🔧 RECOMMENDED BACKEND CONFIGURATION:');
      console.log('='.repeat(80));

      const carePlansEndpoint = successful.find(r => r.endpoint.includes('care_plan'));
      const medicationsEndpoint = successful.find(r => r.endpoint.includes('medication'));
      const notesEndpoint = successful.find(r => r.endpoint.includes('note'));

      if (carePlansEndpoint) {
        console.log(`\nCare Plans: ${carePlansEndpoint.endpoint}`);
      }
      if (medicationsEndpoint) {
        console.log(`Medications: ${medicationsEndpoint.endpoint}`);
      }
      if (notesEndpoint) {
        console.log(`Notes: ${notesEndpoint.endpoint}`);
      }

    } else {
      console.log('\n❌ NO WORKING ENDPOINTS FOUND');
      console.log('\nError summary:');

      const errorCounts = {};
      errors.forEach(e => {
        errorCounts[e.code] = (errorCounts[e.code] || 0) + 1;
      });

      Object.entries(errorCounts).forEach(([code, count]) => {
        console.log(`   ${code}: ${count} endpoints`);
      });

      console.log('\nPossible issues:');
      console.log('   1. API requires different authentication method');
      console.log('   2. Endpoints require different HTTP methods (POST instead of GET)');
      console.log('   3. Demo environment might be restricted');
      console.log('   4. Token permissions insufficient');

      console.log('\nSample errors:');
      errors.slice(0, 5).forEach(e => {
        console.log(`   ${e.endpoint}: ${e.code} - ${e.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

comprehensiveTest();
