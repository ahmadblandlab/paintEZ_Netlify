// netlify/functions/check-availability.js
const crypto = require('crypto');

// ========================================
// MULTI-LOCATION CONFIGURATION
// Add new franchises here as they get onboarded
// ========================================
const LOCATION_CONFIGS = {
  'current_location': {
    businessId: '403923',
    apiPrivateKey: '03c87c55bb7f43b0ad77e5bed7f732da',
    staffId: 512602,
    locationId: 634895,
    reasonId: 733663
  },
  'paintez_north_tampa': {
    businessId: '406031',
    apiPrivateKey: '03c87c55bb7f43b0ad77e5bed7f732da',
    staffId: 513927,
    locationId: 635883,
    reasonId: 735070
  },
  'sandbox': {
    businessId: '403922',
    apiPrivateKey: '35d46d1dc0a843e8a6e712c6f84258a9',
    staffId: 512277,
    locationId: 634571,
    reasonId: 733416
  }
  // Add more locations as franchises get cloned...
};

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
// HELPER: FORMAT TIME
// ========================================
function formatTime(militaryTime) {
  const hour = Math.floor(militaryTime / 100);
  const minute = militaryTime % 100;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { location_id, requested_appointment_date } = body;

    // ========================================
    // LOOKUP LOCATION CONFIGURATION
    // ========================================
    if (!location_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameter: location_id',
          hint: 'Add location_id to request body (e.g., "paintez_north_tampa")',
          available_locations: Object.keys(LOCATION_CONFIGS)
        })
      };
    }

    const config = LOCATION_CONFIGS[location_id];

    if (!config) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Unknown location_id: ${location_id}`,
          available_locations: Object.keys(LOCATION_CONFIGS),
          hint: 'Use one of the available_locations listed above'
        })
      };
    }

    console.log(`Checking availability for: ${location_id}`);

    // Extract credentials for this location
    const { businessId, apiPrivateKey, staffId, locationId, reasonId } = config;

    // ========================================
    // PARSE DATE
    // ========================================
    let year, month, day;
    if (requested_appointment_date && requested_appointment_date.includes('-')) {
      const parts = requested_appointment_date.split('-');
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      year = tomorrow.getFullYear().toString();
      month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      day = tomorrow.getDate().toString().padStart(2, '0');
    }

    // ========================================
    // GET SESSION TOKEN
    // ========================================
    const sessionToken = await getTimeTapSession(businessId, apiPrivateKey);

    // ========================================
    // GET AVAILABLE SLOTS
    // ========================================
    const availabilityUrl = `https://api.timetap.com/live/availability/${year}/${month}/${day}/${staffId}/${locationId}/${reasonId}`;

    const availResponse = await fetch(availabilityUrl, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    const availableSlots = await availResponse.json();

    // ========================================
    // FORMAT RESPONSE
    // ========================================
    if (!Array.isArray(availableSlots) || availableSlots.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          available_times: "no available times",
          success: false,
          requested_date: `${year}-${month}-${day}`,
          location_id: location_id
        })
      };
    }

    const timesList = availableSlots.map(slot => formatTime(slot.clientStartTime));
    const timesString = timesList.join(', ');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        available_times: timesString,
        available_slots_json: JSON.stringify(availableSlots),
        requested_date: `${year}-${month}-${day}`,
        location_id: location_id,
        staff_id: staffId,
        timetap_location_id: locationId,
        reason_id: reasonId,
        success: true
      })
    };

  } catch (error) {
    console.error('Availability check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
