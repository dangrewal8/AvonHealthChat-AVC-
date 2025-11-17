/**
 * Comprehensive Avon Health API Endpoint Testing Script
 *
 * Tests ALL available endpoints for patient: user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1
 *
 * Tech Stack: Node.js 18+, TypeScript, axios
 */

import createAuthenticatedClient from './src/middleware/auth.middleware';

const PATIENT_ID = 'user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1';
const ACCOUNT = 'prosper';

interface EndpointTest {
  category: string;
  endpoint: string;
  params?: Record<string, string>;
  description: string;
}

// Comprehensive list of ALL Avon Health API endpoints
const ENDPOINTS_TO_TEST: EndpointTest[] = [
  // ========================================================================
  // PATIENT CHART - MEDICAL DATA
  // ========================================================================
  { category: 'Medical Data', endpoint: '/v2/allergies', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Patient allergies' },
  { category: 'Medical Data', endpoint: '/v2/conditions', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Patient conditions/diagnoses' },
  { category: 'Medical Data', endpoint: '/v2/family_histories', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Family medical history' },
  { category: 'Medical Data', endpoint: '/v2/medications', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Current medications' },
  { category: 'Medical Data', endpoint: '/v2/vitals', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Vital signs (BP, HR, temp, etc.)' },

  // ========================================================================
  // ORDERS & RESULTS
  // ========================================================================
  { category: 'Lab & Orders', endpoint: '/v2/prescriptions', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Prescriptions' },
  { category: 'Lab & Orders', endpoint: '/v2/lab_results', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Lab results' },
  { category: 'Lab & Orders', endpoint: '/v2/lab_observations', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Individual lab observations' },

  // ========================================================================
  // CLINICAL DOCUMENTATION
  // ========================================================================
  { category: 'Clinical Docs', endpoint: '/v2/notes', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Clinical notes' },
  { category: 'Clinical Docs', endpoint: '/v2/documents', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Clinical documents' },
  { category: 'Clinical Docs', endpoint: '/v2/note_templates', params: { account: ACCOUNT }, description: 'Available note templates' },
  { category: 'Clinical Docs', endpoint: '/v2/document_templates', params: { account: ACCOUNT }, description: 'Available document templates' },

  // ========================================================================
  // CARE PLANNING
  // ========================================================================
  { category: 'Care Planning', endpoint: '/v2/care_plans', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Care plans' },
  { category: 'Care Planning', endpoint: '/v2/care_plan_templates', params: { account: ACCOUNT }, description: 'Available care plan templates' },

  // ========================================================================
  // SCHEDULING
  // ========================================================================
  { category: 'Scheduling', endpoint: '/v2/appointments', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Patient appointments' },
  { category: 'Scheduling', endpoint: '/v2/appointment_types', params: { account: ACCOUNT }, description: 'Available appointment types' },
  { category: 'Scheduling', endpoint: '/v2/slots', params: { account: ACCOUNT }, description: 'Available appointment slots' },

  // ========================================================================
  // MESSAGING & COMMUNICATION
  // ========================================================================
  { category: 'Communication', endpoint: '/v2/message_threads', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Message threads' },
  { category: 'Communication', endpoint: '/v2/messages', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Messages' },
  { category: 'Communication', endpoint: '/v2/notifications', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Notifications' },

  // ========================================================================
  // FORMS & INTAKE
  // ========================================================================
  { category: 'Forms', endpoint: '/v2/form_responses', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Completed form responses' },
  { category: 'Forms', endpoint: '/v2/forms', params: { account: ACCOUNT }, description: 'Available forms' },
  { category: 'Forms', endpoint: '/v2/intake_flows', params: { account: ACCOUNT }, description: 'Intake workflows' },

  // ========================================================================
  // BILLING & INSURANCE
  // ========================================================================
  { category: 'Billing', endpoint: '/v2/insurance_policies', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Insurance policies' },
  { category: 'Billing', endpoint: '/v2/invoices', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Invoices' },
  { category: 'Billing', endpoint: '/v2/superbills', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Superbills' },
  { category: 'Billing', endpoint: '/v2/eligibility_checks', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Insurance eligibility checks' },
  { category: 'Billing', endpoint: '/v2/insurance_claims', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Insurance claims' },
  { category: 'Billing', endpoint: '/v2/billing_items', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Billing items' },
  { category: 'Billing', endpoint: '/v2/diagnoses', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Billable diagnoses' },

  // ========================================================================
  // CORE RESOURCES
  // ========================================================================
  { category: 'Core', endpoint: '/v2/patients', params: { id: PATIENT_ID, account: ACCOUNT }, description: 'Patient demographics' },
  { category: 'Core', endpoint: '/v2/caregivers', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Patient caregivers' },
  { category: 'Core', endpoint: '/v2/care_teams', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Care team members' },
  { category: 'Core', endpoint: '/v2/peer_groups', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Peer groups' },
  { category: 'Core', endpoint: '/v2/tasks', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Assigned tasks' },
  { category: 'Core', endpoint: '/v2/referring_providers', params: { user_id: PATIENT_ID, account: ACCOUNT }, description: 'Referring providers' },

  // ========================================================================
  // FHIR RESOURCES (if available)
  // ========================================================================
  { category: 'FHIR', endpoint: '/v2/fhir/Patient', params: { id: PATIENT_ID }, description: 'FHIR Patient resource' },
  { category: 'FHIR', endpoint: '/v2/fhir/AllergyIntolerance', params: { patient: PATIENT_ID }, description: 'FHIR Allergies' },
  { category: 'FHIR', endpoint: '/v2/fhir/Condition', params: { patient: PATIENT_ID }, description: 'FHIR Conditions' },
  { category: 'FHIR', endpoint: '/v2/fhir/Immunization', params: { patient: PATIENT_ID }, description: 'FHIR Immunizations' },
  { category: 'FHIR', endpoint: '/v2/fhir/MedicationRequest', params: { patient: PATIENT_ID }, description: 'FHIR Medications' },
  { category: 'FHIR', endpoint: '/v2/fhir/Observation', params: { patient: PATIENT_ID }, description: 'FHIR Observations (vitals, labs)' },
  { category: 'FHIR', endpoint: '/v2/fhir/Procedure', params: { patient: PATIENT_ID }, description: 'FHIR Procedures' },
  { category: 'FHIR', endpoint: '/v2/fhir/DiagnosticReport', params: { patient: PATIENT_ID }, description: 'FHIR Diagnostic Reports' },
  { category: 'FHIR', endpoint: '/v2/fhir/DocumentReference', params: { patient: PATIENT_ID }, description: 'FHIR Documents' },
  { category: 'FHIR', endpoint: '/v2/fhir/CarePlan', params: { patient: PATIENT_ID }, description: 'FHIR Care Plans' },
  { category: 'FHIR', endpoint: '/v2/fhir/Goal', params: { patient: PATIENT_ID }, description: 'FHIR Goals' },
];

interface TestResult {
  category: string;
  endpoint: string;
  description: string;
  status: 'success' | 'empty' | 'error' | 'not_found';
  recordCount: number;
  error?: string;
  sampleData?: any;
}

async function testAllEndpoints(): Promise<TestResult[]> {
  const client = createAuthenticatedClient();
  const results: TestResult[] = [];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('COMPREHENSIVE AVON HEALTH API ENDPOINT TESTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Patient ID: ${PATIENT_ID}`);
  console.log(`Account: ${ACCOUNT}`);
  console.log(`Total Endpoints to Test: ${ENDPOINTS_TO_TEST.length}\n`);

  for (const test of ENDPOINTS_TO_TEST) {
    try {
      console.log(`Testing: ${test.endpoint} (${test.description})...`);

      const response = await client.get(test.endpoint, {
        params: test.params,
        timeout: 10000,
      });

      const data = response.data;
      let recordCount = 0;
      let sampleData = null;

      // Determine record count
      if (Array.isArray(data)) {
        recordCount = data.length;
        sampleData = data[0];
      } else if (data && typeof data === 'object') {
        if (data.data && Array.isArray(data.data)) {
          recordCount = data.data.length;
          sampleData = data.data[0];
        } else if (data.results && Array.isArray(data.results)) {
          recordCount = data.results.length;
          sampleData = data.results[0];
        } else {
          recordCount = Object.keys(data).length > 0 ? 1 : 0;
          sampleData = data;
        }
      }

      const status = recordCount > 0 ? 'success' : 'empty';
      const statusIcon = status === 'success' ? '✓' : '○';
      const statusColor = status === 'success' ? '\x1b[32m' : '\x1b[33m'; // Green or Yellow

      console.log(`  ${statusColor}${statusIcon}\x1b[0m Found ${recordCount} record(s)\n`);

      results.push({
        category: test.category,
        endpoint: test.endpoint,
        description: test.description,
        status,
        recordCount,
        sampleData: recordCount > 0 ? sampleData : undefined,
      });

    } catch (error: any) {
      const is404 = error.response?.status === 404;
      const statusIcon = is404 ? '−' : '✗';
      const statusColor = is404 ? '\x1b[90m' : '\x1b[31m'; // Gray or Red

      console.log(`  ${statusColor}${statusIcon}\x1b[0m ${is404 ? 'Not found' : 'Error'}: ${error.message}\n`);

      results.push({
        category: test.category,
        endpoint: test.endpoint,
        description: test.description,
        status: is404 ? 'not_found' : 'error',
        recordCount: 0,
        error: error.message,
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

async function generateReport(results: TestResult[]): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST RESULTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Group by category
  const byCategory: Record<string, TestResult[]> = {};
  for (const result of results) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  }

  // Print summary by category
  for (const [category, categoryResults] of Object.entries(byCategory)) {
    const successCount = categoryResults.filter(r => r.status === 'success').length;
    const emptyCount = categoryResults.filter(r => r.status === 'empty').length;
    const errorCount = categoryResults.filter(r => r.status === 'error').length;
    const notFoundCount = categoryResults.filter(r => r.status === 'not_found').length;

    console.log(`\n${category}:`);
    console.log(`  ✓ Has Data: ${successCount}`);
    console.log(`  ○ Empty: ${emptyCount}`);
    console.log(`  ✗ Error: ${errorCount}`);
    console.log(`  − Not Found: ${notFoundCount}`);

    // List endpoints with data
    const withData = categoryResults.filter(r => r.status === 'success');
    if (withData.length > 0) {
      console.log(`\n  Endpoints with data:`);
      for (const result of withData) {
        console.log(`    • ${result.description}: ${result.recordCount} record(s)`);
      }
    }
  }

  // Overall statistics
  const totalSuccess = results.filter(r => r.status === 'success').length;
  const totalEmpty = results.filter(r => r.status === 'empty').length;
  const totalError = results.filter(r => r.status === 'error').length;
  const totalNotFound = results.filter(r => r.status === 'not_found').length;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OVERALL STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Endpoints Tested: ${results.length}`);
  console.log(`✓ Has Data: ${totalSuccess} (${((totalSuccess / results.length) * 100).toFixed(1)}%)`);
  console.log(`○ Empty: ${totalEmpty} (${((totalEmpty / results.length) * 100).toFixed(1)}%)`);
  console.log(`✗ Error: ${totalError} (${((totalError / results.length) * 100).toFixed(1)}%)`);
  console.log(`− Not Found: ${totalNotFound} (${((totalNotFound / results.length) * 100).toFixed(1)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Write detailed results to JSON file
  const fs = require('fs');
  const reportPath = './avon-api-test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Detailed results saved to: ${reportPath}\n`);
}

// Run the tests
testAllEndpoints()
  .then(generateReport)
  .catch(error => {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  });
