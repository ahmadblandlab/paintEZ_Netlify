// Test script to compare TimeTap client search methods
const crypto = require('crypto');

const CONFIG = {
  businessId: '406031',
  apiPrivateKey: '03c87c55bb7f43b0ad77e5bed7f732da',
  testPhone: '8135551234',
  testClientName: 'Delaine TestClient'
};

// Get session token
async function getSessionToken() {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('md5')
    .update(CONFIG.businessId + CONFIG.apiPrivateKey)
    .digest('hex');

  const url = `https://api.timetap.com/live/sessionToken?apiKey=${CONFIG.businessId}&timestamp=${timestamp}&signature=${signature}`;

  const response = await fetch(url);
  const data = await response.json();
  return data.sessionToken;
}

// Test 1: GET /clients with cellPhone parameter (CURRENT METHOD)
async function testGetWithQueryParam(sessionToken) {
  console.log('\n📋 TEST 1: GET /clients?cellPhone=X (Current Method)');
  console.log('=' .repeat(60));

  const url = `https://api.timetap.com/live/clients?businessId=${CONFIG.businessId}&cellPhone=${CONFIG.testPhone}`;

  console.log('URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    }
  });

  const clients = await response.json();

  console.log(`\n✅ Response: ${clients.length} client(s) returned`);

  if (Array.isArray(clients) && clients.length > 0) {
    clients.forEach((c, i) => {
      console.log(`  [${i}] ID: ${c.clientId}, Name: "${c.fullName}", Phone: "${c.cellPhone}"`);

      if (c.cellPhone === CONFIG.testPhone) {
        console.log('    ✅ MATCH! This is the right client');
      } else {
        console.log('    ❌ WRONG! Phone doesn\'t match');
      }
    });
  }

  return clients;
}

// Test 2: POST /clients/filter (ALTERNATIVE METHOD)
async function testPostFilter(sessionToken) {
  console.log('\n📋 TEST 2: POST /clients/filter (Alternative Method)');
  console.log('=' .repeat(60));

  const url = 'https://api.timetap.com/live/clients/filter';

  // Try different payload formats
  const payloads = [
    { businessId: parseInt(CONFIG.businessId), cellPhone: CONFIG.testPhone },
    { businessId: parseInt(CONFIG.businessId), searchTerm: CONFIG.testPhone },
    { cellPhone: CONFIG.testPhone }
  ];

  for (let i = 0; i < payloads.length; i++) {
    console.log(`\n  Attempt ${i + 1}: Payload:`, JSON.stringify(payloads[i]));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloads[i])
      });

      console.log(`  Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ Error: ${errorText.substring(0, 200)}`);
        continue;
      }

      const clients = await response.json();

      console.log(`  ✅ Response: ${Array.isArray(clients) ? clients.length : 'N/A'} client(s)`);

      if (Array.isArray(clients) && clients.length > 0) {
        clients.forEach((c, idx) => {
          console.log(`    [${idx}] ID: ${c.clientId}, Name: "${c.fullName}", Phone: "${c.cellPhone}"`);

          if (c.cellPhone === CONFIG.testPhone) {
            console.log('      ✅ MATCH! This is the right client');
          }
        });

        return clients; // Success!
      }
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }

  return null;
}

// Test 3: GET /clients without filters (fetch all, filter locally)
async function testGetAllAndFilter(sessionToken) {
  console.log('\n📋 TEST 3: GET /clients (All) + Filter Locally');
  console.log('=' .repeat(60));

  const url = `https://api.timetap.com/live/clients?businessId=${CONFIG.businessId}`;

  console.log('URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    }
  });

  const clients = await response.json();

  console.log(`\n✅ Response: ${clients.length} total client(s)`);

  // Filter locally
  const cleanPhone = CONFIG.testPhone.replace(/\D/g, '');
  const match = clients.find(c => {
    const clientPhone = (c.cellPhone || '').replace(/\D/g, '');
    return clientPhone === cleanPhone;
  });

  if (match) {
    console.log(`\n✅ FOUND MATCH by filtering locally!`);
    console.log(`  ID: ${match.clientId}, Name: "${match.fullName}", Phone: "${match.cellPhone}"`);
  } else {
    console.log(`\n❌ No match found in ${clients.length} clients`);
  }

  return match;
}

// Run all tests
async function runTests() {
  console.log('\n🧪 TESTING TIMETAP CLIENT SEARCH METHODS');
  console.log('='.repeat(60));
  console.log(`Looking for: ${CONFIG.testClientName} (Phone: ${CONFIG.testPhone})`);

  try {
    // Get session token
    console.log('\n🔑 Getting session token...');
    const sessionToken = await getSessionToken();
    console.log('✅ Session token obtained');

    // Run tests
    await testGetWithQueryParam(sessionToken);
    await testPostFilter(sessionToken);
    await testGetAllAndFilter(sessionToken);

    // Summary
    console.log('\n\n📊 SUMMARY & RECOMMENDATION');
    console.log('='.repeat(60));
    console.log('Based on the results above:');
    console.log('- If Test 2 worked → Use POST /clients/filter');
    console.log('- If Test 3 worked → Fetch all + filter locally');
    console.log('- If none worked → Use ClientTether as source of truth');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run it!
runTests();
