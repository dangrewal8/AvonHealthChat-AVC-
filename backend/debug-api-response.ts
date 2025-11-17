/**
 * Debug script to see actual API response format
 * Tech Stack: Node.js 18+, TypeScript, axios
 */

import createAuthenticatedClient from './src/middleware/auth.middleware';

const PATIENT_ID = 'user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1';
const ACCOUNT = 'prosper';

async function debugApiResponse() {
  const client = createAuthenticatedClient();

  console.log('Testing API response format...\n');

  // Test a few endpoints to see actual response structure
  const endpoints = [
    { name: 'notes', path: '/v2/notes' },
    { name: 'documents', path: '/v2/documents' },
    { name: 'conditions', path: '/v2/conditions' },
    { name: 'allergies', path: '/v2/allergies' },
    { name: 'medications', path: '/v2/medications' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${endpoint.name} (${endpoint.path})`);
      console.log('='.repeat(60));

      const response = await client.get(endpoint.path, {
        params: { user_id: PATIENT_ID, account: ACCOUNT },
      });

      console.log(`Status: ${response.status}`);
      console.log(`Response type: ${typeof response.data}`);
      console.log(`Is array: ${Array.isArray(response.data)}`);

      if (Array.isArray(response.data)) {
        console.log(`Array length: ${response.data.length}`);
        if (response.data.length > 0) {
          console.log('\nFirst item:');
          console.log(JSON.stringify(response.data[0], null, 2));
        }
      } else if (typeof response.data === 'object') {
        console.log('\nResponse keys:', Object.keys(response.data));
        if (response.data.data) {
          console.log(`data.data is array: ${Array.isArray(response.data.data)}`);
          if (Array.isArray(response.data.data)) {
            console.log(`data.data length: ${response.data.data.length}`);
            if (response.data.data.length > 0) {
              console.log('\nFirst item in data.data:');
              console.log(JSON.stringify(response.data.data[0], null, 2));
            }
          }
        }
        if (response.data.results) {
          console.log(`data.results is array: ${Array.isArray(response.data.results)}`);
          if (Array.isArray(response.data.results)) {
            console.log(`data.results length: ${response.data.results.length}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
      }
    }
  }
}

debugApiResponse()
  .then(() => {
    console.log('\n\nDebug complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
