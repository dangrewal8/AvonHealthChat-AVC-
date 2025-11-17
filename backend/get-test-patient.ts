/**
 * Quick script to get available test patient IDs from Avon Health API
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.development') });

const clientId = process.env.AVON_CLIENT_ID;
const clientSecret = process.env.AVON_CLIENT_SECRET;
const baseUrl = process.env.AVON_BASE_URL;

async function getAccessToken() {
  try {
    console.log('🔐 Getting access token...');
    const response = await axios.post(`${baseUrl}/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Access token obtained');
    return response.data.access_token;
  } catch (error: any) {
    console.error('❌ Failed to get access token:');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function getPatients(token: string) {
  try {
    console.log('\n📋 Fetching available patients...');

    // Try to list care plans to see what patient IDs exist
    const response = await axios.get(`${baseUrl}/v2/care_plans`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 10 // Get first 10
      }
    });

    console.log('✅ Successfully fetched care plans');
    console.log(`   Total results: ${response.data.results?.length || 0}`);

    if (response.data.results && response.data.results.length > 0) {
      // Extract unique patient IDs
      const patientIds = [...new Set(response.data.results.map((cp: any) => cp.patient_id))];

      console.log('\n📌 Available Patient IDs:');
      patientIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });

      console.log('\n💡 Use one of these patient IDs in your test script!');
      console.log(`   Example: const TEST_PATIENT_ID = '${patientIds[0]}';`);

      return patientIds;
    } else {
      console.log('⚠️  No care plans found. Trying to fetch medications...');

      // Try medications endpoint
      const medResponse = await axios.get(`${baseUrl}/v2/medications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 10
        }
      });

      if (medResponse.data.results && medResponse.data.results.length > 0) {
        const patientIds = [...new Set(medResponse.data.results.map((med: any) => med.patient_id))];

        console.log('\n📌 Available Patient IDs (from medications):');
        patientIds.forEach((id, index) => {
          console.log(`   ${index + 1}. ${id}`);
        });

        return patientIds;
      } else {
        console.log('⚠️  No data found. You may need to use the specific test patient ID from Avon Health docs.');
        console.log('   Try patient_id from your UI login: user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1');
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch patients:');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         Avon Health - Get Test Patient IDs                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('Configuration:');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Client ID: ${clientId?.substring(0, 10)}...`);
  console.log('');

  try {
    const token = await getAccessToken();
    await getPatients(token);
  } catch (error) {
    console.log('\n❌ Test failed. Please check your credentials in .env.development');
    process.exit(1);
  }
}

main();
