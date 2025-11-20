// netlify/functions/setup-location.js
// ========================================
// INTERNAL TOOL: Auto-discover TimeTap IDs for new franchises
// This is NOT called by Bland AI - only by IT team during onboarding
// ========================================

const crypto = require('crypto');

// ========================================
// HELPER: GET TIMETAP SESSION TOKEN
// ========================================
async function getTimeTapSession(businessId, apiPrivateKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('md5')
    .update(businessId + apiPrivateKey)
    .digest('hex');

  const sessionUrl = `https://api.timetap.com/live/sessionToken?apiKey=${businessId}&timestamp=${timestamp}&signature=${signature}`;

  const response = await fetch(sessionUrl);
  const data = await response.json();
  return data.sessionToken;
}

// ========================================
// HELPER: FETCH WITH AUTH
// ========================================
async function getWithAuth(url, sessionToken) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// ========================================
// NETLIFY FUNCTION HANDLER
// ========================================
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        hint: 'Use POST with business_id and api_private_key in body'
      })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { business_id, api_private_key, location_name } = body;

    // ========================================
    // VALIDATE INPUT
    // ========================================
    if (!business_id || !api_private_key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters',
          required: ['business_id', 'api_private_key'],
          optional: ['location_name'],
          example: {
            business_id: '406031',
            api_private_key: '03c87c55bb7f43b0ad77e5bed7f732da',
            location_name: 'paintez_miami'
          }
        })
      };
    }

    const locationKey = location_name || `location_${business_id}`;
    console.log(`🔍 Discovering IDs for: ${locationKey}`);

    // ========================================
    // GET SESSION TOKEN
    // ========================================
    const sessionToken = await getTimeTapSession(business_id, api_private_key);
    console.log('✅ Session token obtained');

    // ========================================
    // FETCH ALL AVAILABLE IDS
    // ========================================
    console.log('📡 Fetching staff, locations, and reasons...');
    const [staffList, locationList, reasonList] = await Promise.all([
      getWithAuth('https://api.timetap.com/live/staffIdList', sessionToken),
      getWithAuth('https://api.timetap.com/live/locationIdList', sessionToken),
      getWithAuth('https://api.timetap.com/live/reasonIdList', sessionToken)
    ]);

    console.log(`✅ Found ${Array.isArray(staffList) ? staffList.length : 0} staff members`);
    console.log(`✅ Found ${Array.isArray(locationList) ? locationList.length : 0} locations`);
    console.log(`✅ Found ${Array.isArray(reasonList) ? reasonList.length : 0} reasons`);

    // ========================================
    // FORMAT RESPONSE
    // ========================================
    const result = {
      success: true,
      message: `Successfully discovered IDs for ${locationKey}`,
      location_key: locationKey,
      credentials: {
        businessId: business_id,
        apiPrivateKey: api_private_key
      },
      discovered_ids: {
        staff: Array.isArray(staffList) ? staffList : [],
        locations: Array.isArray(locationList) ? locationList : [],
        reasons: Array.isArray(reasonList) ? reasonList : []
      },
      config_template: {
        [locationKey]: {
          businessId: business_id,
          apiPrivateKey: api_private_key,
          staffId: Array.isArray(staffList) && staffList.length > 0 ? staffList[0] : null,
          locationId: Array.isArray(locationList) && locationList.length > 0 ? locationList[0] : null,
          reasonId: Array.isArray(reasonList) && reasonList.length > 0 ? reasonList[0] : null,
          _note: 'Review discovered_ids above and update these values as needed'
        }
      },
      next_steps: [
        '1. Review the discovered_ids to choose the correct staff, location, and reason',
        '2. Update the config_template with the correct IDs if needed',
        '3. Copy the config_template object into LOCATION_CONFIGS in both check-availability.js and book-appointment.js',
        '4. Redeploy to Netlify',
        `5. Test with location_id: "${locationKey}"`
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('❌ Setup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        hint: 'Check that business_id and api_private_key are correct'
      })
    };
  }
};
