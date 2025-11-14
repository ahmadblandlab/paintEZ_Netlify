// netlify/functions/check-availability.js
const crypto = require('crypto');

// ========================================
// YOUR TIMETAP CREDENTIALS
// ========================================
const BUSINESS_ID = '403923';
const API_PRIVATE_KEY = '03c87c55bb7f43b0ad77e5bed7f732da';
const STAFF_ID = 512602;
const LOCATION_ID = 634895;
const REASON_ID = 733663;

// ========================================
// HELPER: GET TIMETAP SESSION TOKEN
// ========================================
async function getTimeTapSession() {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('md5')
    .update(BUSINESS_ID + API_PRIVATE_KEY)
    .digest('hex');

  const sessionUrl = `https://api.timetap.com/live/sessionToken?apiKey=${BUSINESS_ID}&timestamp=${timestamp}&signature=${signature}`;

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
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { requested_appointment_date } = body;

    // Parse date
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

    // Get session token
    const sessionToken = await getTimeTapSession();

    // Get available slots
    const availabilityUrl = `https://api.timetap.com/live/availability/${year}/${month}/${day}/${STAFF_ID}/${LOCATION_ID}/${REASON_ID}`;
    
    const availResponse = await fetch(availabilityUrl, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    const availableSlots = await availResponse.json();

    // Format response
    if (!Array.isArray(availableSlots) || availableSlots.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          available_times: "no available times",
          success: false,
          requested_date: `${year}-${month}-${day}`
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
        staff_id: STAFF_ID,
        location_id: LOCATION_ID,
        reason_id: REASON_ID,
        success: true
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};