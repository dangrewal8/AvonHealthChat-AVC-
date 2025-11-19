/**
 * Comprehensive Avon Health API Endpoint Investigation
 * Tests all available v2 endpoints and documents data structures
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const BASE_URL = process.env.AVON_BASE_URL;
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;
const ACCOUNT = process.env.AVON_ACCOUNT;
const USER_ID = process.env.AVON_USER_ID;
const PATIENT_ID = 'user_BPJpEJejcMVFPmTx5OQwggCVAun1'; // Known working patient ID

// All v2 endpoints to investigate
const ENDPOINTS_TO_TEST = [
  // Currently using
  { name: 'Care Plans', path: '/v2/care_plans', priority: 'HIGH' },
  { name: 'Medications', path: '/v2/medications', priority: 'HIGH' },
  { name: 'Notes', path: '/v2/notes', priority: 'HIGH' },

  // Patient information
  { name: 'Patients', path: '/v2/patients', priority: 'CRITICAL' },

  // Medical history
  { name: 'Allergies', path: '/v2/allergies', priority: 'HIGH' },
  { name: 'Conditions', path: '/v2/conditions', priority: 'HIGH' },
  { name: 'Family History', path: '/v2/family_histories', priority: 'MEDIUM' },

  // Vital signs & measurements
  { name: 'Vitals', path: '/v2/vitals', priority: 'HIGH' },

  // Scheduling
  { name: 'Appointments', path: '/v2/appointments', priority: 'HIGH' },
  { name: 'Appointment Types', path: '/v2/appointment_types', priority: 'LOW' },
  { name: 'Slots', path: '/v2/slots', priority: 'LOW' },

  // Clinical orders & results
  { name: 'Prescriptions', path: '/v2/prescriptions', priority: 'HIGH' },
  { name: 'Lab Results', path: '/v2/lab_results', priority: 'HIGH' },

  // Documents & forms
  { name: 'Documents', path: '/v2/documents', priority: 'MEDIUM' },
  { name: 'Forms', path: '/v2/forms', priority: 'MEDIUM' },
  { name: 'Form Responses', path: '/v2/form_responses', priority: 'MEDIUM' },

  // Communication
  { name: 'Messages', path: '/v2/messages', priority: 'MEDIUM' },
  { name: 'Message Threads', path: '/v2/message_threads', priority: 'LOW' },

  // Care team
  { name: 'Providers', path: '/v2/providers', priority: 'LOW' },
  { name: 'Caregivers', path: '/v2/caregivers', priority: 'MEDIUM' },
  { name: 'Users', path: '/v2/users', priority: 'LOW' },

  // Financial
  { name: 'Insurance Policies', path: '/v2/insurance_policies', priority: 'MEDIUM' },
  { name: 'Invoices', path: '/v2/invoices', priority: 'LOW' },

  // Administrative
  { name: 'Notifications', path: '/v2/notifications', priority: 'LOW' },
  { name: 'Tasks', path: '/v2/tasks', priority: 'LOW' },
];

async function main() {
  try {
    console.log('🔍 COMPREHENSIVE AVON HEALTH API INVESTIGATION\n');
    console.log('=' .repeat(70));

    // Step 1: Get Bearer Token
    console.log('\n🔐 Step 1: Obtaining Bearer Token (organization-level)...');
    const bearerResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    const bearerToken = bearerResponse.data.access_token;
    console.log('✅ Bearer token obtained');

    // Step 2: Get JWT Token
    console.log('\n🔐 Step 2: Obtaining JWT Token (user-level)...');
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

    // Step 3: Test all endpoints
    console.log('\n📊 Step 3: Testing all API endpoints...\n');
    console.log('=' .repeat(70));

    const results = [];
    const dataExamples = {};

    for (const endpoint of ENDPOINTS_TO_TEST) {
      console.log(`\n[${endpoint.priority}] Testing: ${endpoint.name}`);
      console.log(`   Endpoint: ${endpoint.path}`);

      try {
        const response = await axios.get(
          `${BASE_URL}${endpoint.path}`,
          {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
              'x-jwt': jwtToken,
              'account': ACCOUNT,
              'Content-Type': 'application/json',
            },
          }
        );

        const dataArray = response.data.data || response.data || [];
        const count = Array.isArray(dataArray) ? dataArray.length : 1;

        console.log(`   ✅ SUCCESS - Found ${count} record(s)`);

        // Store sample data if available
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          // Get sample record and document its structure
          const sample = dataArray[0];
          const fields = Object.keys(sample);
          console.log(`   📝 Fields: ${fields.slice(0, 5).join(', ')}${fields.length > 5 ? '...' : ''}`);

          dataExamples[endpoint.name] = {
            sampleRecord: sample,
            totalCount: count,
            fields: fields,
          };
        }

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          priority: endpoint.priority,
          status: 'SUCCESS',
          recordCount: count,
        });

      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        console.log(`   ❌ FAILED - ${status}: ${message}`);

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          priority: endpoint.priority,
          status: 'FAILED',
          errorCode: status,
          errorMessage: message,
        });
      }
    }

    // Step 4: Generate comprehensive report
    console.log('\n\n' + '='.repeat(70));
    console.log('📋 INVESTIGATION SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status === 'FAILED');

    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);

    console.log('\n\n📊 SUCCESSFUL ENDPOINTS (with data):');
    console.log('-'.repeat(70));
    successful
      .filter(r => r.recordCount > 0)
      .sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .forEach(r => {
        console.log(`[${r.priority}] ${r.name.padEnd(25)} - ${r.recordCount} records`);
      });

    console.log('\n\n📊 AVAILABLE BUT EMPTY ENDPOINTS:');
    console.log('-'.repeat(70));
    successful
      .filter(r => r.recordCount === 0)
      .forEach(r => {
        console.log(`[${r.priority}] ${r.name.padEnd(25)} - No data`);
      });

    if (failed.length > 0) {
      console.log('\n\n❌ FAILED ENDPOINTS:');
      console.log('-'.repeat(70));
      failed.forEach(r => {
        console.log(`[${r.priority}] ${r.name.padEnd(25)} - ${r.errorCode}: ${r.errorMessage}`);
      });
    }

    // Save detailed results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        withData: successful.filter(r => r.recordCount > 0).length,
      },
      results: results,
      dataExamples: dataExamples,
    };

    fs.writeFileSync(
      'endpoint-investigation-report.json',
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n\n💾 Detailed report saved to: endpoint-investigation-report.json');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Investigation failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

main();
