// netlify/functions/book-appointment.js
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
// HELPER: CONVERT TO MILITARY TIME
// ========================================
function toMilitaryTime(timeString) {
  if (!timeString) return 900;
  
  const cleanTime = timeString.trim().toUpperCase();
  
  if (/^\d{3,4}$/.test(cleanTime.replace(':', ''))) {
    return parseInt(cleanTime.replace(':', ''));
  }
  
  const match = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
  if (!match) return 900;
  
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2] || '0');
  const period = match[3];
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return hour * 100 + minute;
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
    const {
      customer_first_name,
      customer_last_name,
      customer_phone,
      property_address,
      zip_code,
      requested_appointment_date,
      confirmed_appointment_time,
      project_type
    } = body;

    // Convert time
    const militaryTime = toMilitaryTime(confirmed_appointment_time);
    const endTime = militaryTime + 100;

    // Get session token
    const sessionToken = await getTimeTapSession();

    // Build appointment payload
    const appointmentPayload = {
      businessId: parseInt(BUSINESS_ID),
      client: {
        firstName: customer_first_name || "Unknown",
        lastName: customer_last_name || "Customer",
        cellPhone: customer_phone || "",
        address: property_address || "",
        zip: zip_code || ""
      },
      clientStartDate: requested_appointment_date,
      clientEndDate: requested_appointment_date,
      clientStartTime: militaryTime,
      clientEndTime: endTime,
      startDate: requested_appointment_date,
      endDate: requested_appointment_date,
      startTime: militaryTime,
      endTime: endTime,
      location: { locationId: LOCATION_ID },
      staff: { professionalId: STAFF_ID },
      reason: { reasonId: REASON_ID },
      clientReminderHours: 24,
      staffReminderHours: 24,
      remindClientSmsHrs: 2,
      remindStaffSmsHrs: 0,
      sendConfirmationToClient: true,
      sendConfirmationToStaff: true,
      status: "OPEN",
      note: `Project Type: ${project_type || 'Not specified'}. Address: ${property_address || 'Not specified'}.`
    };

    // Book appointment
    const bookingUrl = 'https://api.timetap.com/live/appointments';
    const bookingResponse = await fetch(bookingUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentPayload)
    });

    const bookingResult = await bookingResponse.json();

    if (bookingResponse.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          appointment_id: bookingResult.calendarId || 'Unknown',
          confirmation_number: bookingResult.appointmentIdHash || 'Unknown',
          appointment_date: requested_appointment_date,
          appointment_time: confirmed_appointment_time,
          customer_name: `${customer_first_name} ${customer_last_name}`,
          status_message: 'Appointment booked successfully!'
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: JSON.stringify(bookingResult),
          status_message: 'Booking failed'
        })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        status_message: 'Booking failed with exception'
      })
    };
  }
};