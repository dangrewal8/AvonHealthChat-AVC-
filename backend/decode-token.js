/**
 * Decode JWT token to understand its contents
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com';
const CLIENT_ID = process.env.AVON_CLIENT_ID;
const CLIENT_SECRET = process.env.AVON_CLIENT_SECRET;

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return { header, payload };
  } catch (error) {
    console.error('Error decoding JWT:', error.message);
    return null;
  }
}

async function analyzeToken() {
  console.log('\n🔍 Decoding Avon Health Access Token');
  console.log('='.repeat(80));

  try {
    const tokenResponse = await axios.post(`${BASE_URL}/v2/auth/token`, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Token obtained\n');

    const decoded = decodeJWT(accessToken);

    if (decoded) {
      console.log('📋 TOKEN HEADER:');
      console.log(JSON.stringify(decoded.header, null, 2));

      console.log('\n📋 TOKEN PAYLOAD:');
      console.log(JSON.stringify(decoded.payload, null, 2));

      console.log('\n📊 KEY INFORMATION:');
      console.log(`   Issuer: ${decoded.payload.iss || 'N/A'}`);
      console.log(`   Subject: ${decoded.payload.sub || 'N/A'}`);
      console.log(`   Audience: ${decoded.payload.aud || 'N/A'}`);
      console.log(`   Issued At: ${decoded.payload.iat ? new Date(decoded.payload.iat * 1000).toISOString() : 'N/A'}`);
      console.log(`   Expires At: ${decoded.payload.exp ? new Date(decoded.payload.exp * 1000).toISOString() : 'N/A'}`);
      console.log(`   Scopes: ${decoded.payload.scope || decoded.payload.scopes || 'N/A'}`);
      console.log(`   Permissions: ${decoded.payload.permissions ? JSON.stringify(decoded.payload.permissions) : 'N/A'}`);

      if (decoded.payload.account || decoded.payload.account_id || decoded.payload.organization) {
        console.log(`\n🏢 ACCOUNT INFO:`);
        console.log(`   Account: ${decoded.payload.account || decoded.payload.account_id || decoded.payload.organization || 'N/A'}`);
      }

      if (decoded.payload.user || decoded.payload.user_id || decoded.payload.userId) {
        console.log(`\n👤 USER INFO:`);
        console.log(`   User: ${decoded.payload.user || decoded.payload.user_id || decoded.payload.userId || 'N/A'}`);
      }

      console.log('\n📝 FULL PAYLOAD:');
      console.log(JSON.stringify(decoded.payload, null, 2));
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

analyzeToken();
