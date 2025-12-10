// netlify/functions/book-appointment.js
const crypto = require('crypto');

// ========================================
// CLIENTTETHER CRM CONFIGURATION
// Verified against official API v2.0 documentation
// Uses X-Access-Token and X-Web-Key authentication in headers
// ========================================
const CLIENTTETHER_CONFIG = {
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqYXNvbmFsbGVuIiwicm9sZSI6IjUiLCJvcmlnaW4iOiIxIn0.ej3zJE5Ju6rAdU0XctXW-KjS8l52pPdbkEEsDQhPzDc',
  webKey: 'CT_574bf374ca11e449b9b6ffd83d71e341',
  baseUrl: 'https://api.clienttether.com/v2/api',
  apiUrl: 'https://api.clienttether.com/v2/api/create_client'
};

// ========================================
// MULTI-LOCATION CONFIGURATION
// Must match check-availability.js configuration
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
// HELPER: SEARCH FOR EXISTING CLIENT IN TIMETAP
// Searches by phone number (primary identifier)
// Returns clientId if found, null if not found
// ========================================
async function searchTimeTapClient(sessionToken, businessId, phone) {
  try {
    // Clean phone number - remove all non-digits
    const cleanPhone = (phone || '').replace(/\D/g, '');

    if (!cleanPhone) {
      console.log('No phone provided for client search');
      return null;
    }

    // Search for client by phone using GET /clients endpoint
    const searchUrl = `https://api.timetap.com/live/clients?businessId=${businessId}&cellPhone=${cleanPhone}`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('TimeTap client search failed:', response.status);
      return null; // Return null if search fails, will create new client
    }

    const clients = await response.json();

    // Check if any clients were found
    if (clients && Array.isArray(clients) && clients.length > 0) {
      // Find client with matching phone number
      const matchingClient = clients.find(client => {
        const clientPhone = (client.cellPhone || '').replace(/\D/g, '');
        return clientPhone === cleanPhone;
      });

      if (matchingClient) {
        console.log(`✅ Existing TimeTap client found: ${matchingClient.clientId} with matching phone ${cleanPhone}`);
        return matchingClient.clientId;
      }

      console.log(`⚠️ TimeTap returned ${clients.length} client(s) but none matched phone ${cleanPhone}`);
    }

    console.log('No existing TimeTap client found');
    return null;
  } catch (error) {
    console.error('Error searching for TimeTap client:', error.message);
    return null; // Return null on error, will create new client
  }
}

// ========================================
// HELPER: CREATE CLIENT IN TIMETAP
// Creates a client first, returns clientId
// ========================================
async function createTimeTapClient(sessionToken, clientData) {
  const createClientUrl = 'https://api.timetap.com/live/clients';

  const response = await fetch(createClientUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('TimeTap client creation failed:', errorText);
    throw new Error(`Failed to create client: ${response.status}`);
  }

  const result = await response.json();
  console.log('TimeTap client created:', result);
  return result.clientId;
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
// HELPER: SEARCH FOR EXISTING CLIENT IN CLIENTTETHER
// Searches by phone number
// Returns client_id if found, null if not found
// ========================================
async function searchClientTetherClient(phone) {
  try {
    const cleanPhone = (phone || '').replace(/\D/g, '');

    if (!cleanPhone) {
      console.log('No phone provided for ClientTether search');
      return null;
    }

    const searchUrl = `${CLIENTTETHER_CONFIG.baseUrl}/read_client_exist?phone=${cleanPhone}`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
        'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('ClientTether search failed:', response.status);
      return null;
    }

    const result = await response.json();
    const resultCode = result.ResultCode || result.resultCode;

    if (resultCode === 'CT_200' || resultCode === 'CT200') {
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const clientId = result.data[0].client_id;
        console.log(`✅ Existing ClientTether client found: ${clientId}`);
        return clientId;
      }
    }

    console.log('No existing ClientTether client found');
    return null;
  } catch (error) {
    console.error('Error searching ClientTether:', error.message);
    return null;
  }
}

// ========================================
// HELPER: UPDATE EXISTING CLIENT IN CLIENTTETHER
// Updates an existing client by client_id
// ========================================
async function updateClientTetherClient(clientId, customerData) {
  try {
    const { first_name, last_name, phone, email, address, zip } = customerData;

    const payload = {
      client_id: clientId,
      firstName: first_name || '',
      lastName: last_name || '',
      phone: (phone || '').replace(/\D/g, ''),
      email: email || '',
      address: address || '',
      zip: zip || ''
    };

    console.log('Updating ClientTether client:', clientId);

    const updateUrl = `${CLIENTTETHER_CONFIG.baseUrl}/update_client_by_id`;

    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
        'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const resultCode = result.ResultCode || result.resultCode;
    const success = (resultCode === 'CT_200' || resultCode === 'CT200');

    if (success) {
      console.log('✅ ClientTether client updated successfully');
      return { success: true, result };
    } else {
      console.error('⚠️ ClientTether update failed:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('⚠️ ClientTether update exception:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// HELPER: SYNC TO CLIENTTETHER CRM
// Uses correct ClientTether API v2.0 format verified from official docs
// ========================================
async function syncToClientTether(customerData) {
  try {
    const { first_name, last_name, phone, email, address, zip } = customerData;

    // Build payload with correct field names (camelCase, not snake_case)
    const payload = {
      firstName: first_name || '',
      lastName: last_name || '',
      phone: (phone || '').replace(/\D/g, ''),  // Clean to 10 digits only
      email: email || '',
      address: address || '',
      zip: zip || ''
    };

    console.log('Syncing to ClientTether:', JSON.stringify(payload, null, 2));

    // Use correct authentication: X-Access-Token and X-Web-Key in HEADERS
    const response = await fetch(CLIENTTETHER_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
        'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Check for ClientTether success codes (CT_200 or CT200)
    const resultCode = result.ResultCode || result.resultCode;
    const isSuccess = (resultCode === 'CT_200' || resultCode === 'CT200');

    if (isSuccess) {
      console.log('✅ ClientTether sync successful:', result);
      return { success: true, result };
    } else {
      console.error('⚠️ ClientTether sync failed:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('⚠️ ClientTether sync exception:', error);
    return { success: false, error: error.message };
  }
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
    const {
      location_id,
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_email,
      property_address,
      zip_code,
      requested_appointment_date,
      confirmed_appointment_time,
      project_type
    } = body;

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

    console.log(`Booking appointment for: ${location_id}`);

    // Extract credentials for this location
    const { businessId, apiPrivateKey, staffId, locationId, reasonId } = config;

    // ========================================
    // GET SESSION TOKEN
    // ========================================
    const sessionToken = await getTimeTapSession(businessId, apiPrivateKey);

    // ========================================
    // FETCH AVAILABILITY TO GET CORRECT TIMEZONE SLOT
    // ========================================
    // Parse the date
    const dateParts = requested_appointment_date.split('-');
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];

    // Get availability for this date to find the exact slot
    const availabilityUrl = `https://api.timetap.com/live/availability/${year}/${month}/${day}/${staffId}/${locationId}/${reasonId}`;

    const availResponse = await fetch(availabilityUrl, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    const availableSlots = await availResponse.json();

    // Convert customer's chosen time to military time
    const customerMilitaryTime = toMilitaryTime(confirmed_appointment_time);

    // Find the matching slot based on clientStartTime
    const matchingSlot = availableSlots.find(slot => slot.clientStartTime === customerMilitaryTime);

    if (!matchingSlot) {
      console.error(`No slot found for time ${confirmed_appointment_time} (${customerMilitaryTime})`);
      console.error('Available slots:', JSON.stringify(availableSlots, null, 2));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Selected time ${confirmed_appointment_time} is not available`,
          hint: 'Please call check-availability first to get current available times'
        })
      };
    }

    // Use the actual slot times (handles timezone automatically)
    const militaryTime = matchingSlot.startTime;
    const endTime = matchingSlot.endTime;

    // ========================================
    // CREATE CLIENT IN TIMETAP FIRST
    // ========================================
    const fullName = `${customer_first_name || 'Unknown'} ${customer_last_name || 'Customer'}`.trim();

    const clientPayload = {
      firstName: customer_first_name || "Unknown",
      lastName: customer_last_name || "Customer",
      fullName: fullName,
      cellPhone: customer_phone || "",
      emailAddress: customer_email || "",
      address1: property_address || "",
      zip: zip_code || "",
      status: "Active",
      fields: [
        { code: "firstName", value: customer_first_name || "Unknown" },
        { code: "lastName", value: customer_last_name || "Customer" },
        { code: "fullName", value: fullName },
        { code: "emailAddress", value: customer_email || "" },
        { code: "cellPhone", value: customer_phone || "" },
        { code: "address1", value: property_address || "" },
        { code: "zip", value: zip_code || "" }
      ]
    };

    // Search for existing client first (duplicate prevention)
    console.log('Searching for existing TimeTap client by phone:', customer_phone);
    let clientId = await searchTimeTapClient(sessionToken, businessId, customer_phone);

    if (clientId) {
      console.log(`✅ Using existing TimeTap client: ${clientId}`);
    } else {
      console.log('Creating new client in TimeTap:', JSON.stringify(clientPayload, null, 2));
      clientId = await createTimeTapClient(sessionToken, clientPayload);
      console.log(`✅ New TimeTap client created: ${clientId}`);
    }

    // ========================================
    // BUILD APPOINTMENT PAYLOAD
    // ========================================
    const appointmentPayload = {
      businessId: parseInt(businessId),
      client: { clientId: clientId },  // Reference the client by ID
      clientStartDate: requested_appointment_date,
      clientEndDate: requested_appointment_date,
      clientStartTime: militaryTime,
      clientEndTime: endTime,
      startDate: requested_appointment_date,
      endDate: requested_appointment_date,
      startTime: militaryTime,
      endTime: endTime,
      location: { locationId: locationId },
      staff: { professionalId: staffId },
      reason: { reasonId: reasonId },
      clientReminderHours: 24,
      staffReminderHours: 24,
      remindClientSmsHrs: 2,
      remindStaffSmsHrs: 0,
      sendConfirmationToClient: true,
      sendConfirmationToStaff: true,
      status: "OPEN",
      note: `Project Type: ${project_type || 'Not specified'}. Address: ${property_address || 'Not specified'}.`
    };

    console.log('Booking payload:', JSON.stringify(appointmentPayload, null, 2));

    // ========================================
    // BOOK APPOINTMENT
    // ========================================
    const bookingUrl = 'https://api.timetap.com/live/appointments';
    const bookingResponse = await fetch(bookingUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentPayload)
    });

    const responseText = await bookingResponse.text();
    console.log('TimeTap response:', responseText);

    let bookingResult;
    try {
      bookingResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'TimeTap returned non-JSON response',
          raw_response: responseText.substring(0, 500),
          status_message: 'Booking failed - TimeTap API error'
        })
      };
    }

    if (bookingResponse.ok) {
      // ========================================
      // SYNC TO CLIENTTETHER CRM (NON-BLOCKING WITH DUPLICATE CHECKING)
      // ========================================
      // Don't await - sync in background, don't fail booking if CRM sync fails
      (async () => {
        try {
          console.log('Searching for existing ClientTether client by phone:', customer_phone);
          const clientTetherClientId = await searchClientTetherClient(customer_phone);

          const customerData = {
            first_name: customer_first_name,
            last_name: customer_last_name,
            phone: customer_phone,
            email: customer_email,
            address: property_address,
            zip: zip_code
          };

          if (clientTetherClientId) {
            // Client exists - update
            console.log(`✅ Updating existing ClientTether client: ${clientTetherClientId}`);
            const updateResult = await updateClientTetherClient(clientTetherClientId, customerData);
            if (updateResult.success) {
              console.log('✅ ClientTether client updated successfully');
            } else {
              console.error('⚠️ ClientTether update failed:', updateResult.error);
            }
          } else {
            // Client doesn't exist - create
            console.log('Creating new ClientTether client');
            const syncResult = await syncToClientTether(customerData);
            if (syncResult.success) {
              console.log('✅ New ClientTether client created');
            } else {
              console.error('⚠️ ClientTether creation failed:', syncResult.error);
            }
          }
        } catch (error) {
          console.error('⚠️ ClientTether sync exception (booking still succeeded):', error);
        }
      })();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          appointment_id: bookingResult.calendarId || 'Unknown',
          confirmation_number: bookingResult.appointementIdHash || bookingResult.appointmentIdHash || 'Unknown',
          appointment_date: requested_appointment_date,
          appointment_time: confirmed_appointment_time,
          customer_name: `${customer_first_name} ${customer_last_name}`,
          location_id: location_id,
          status_message: 'Appointment booked successfully!'
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: bookingResult,
          status_message: 'Booking failed - check error field'
        })
      };
    }

  } catch (error) {
    console.error('Booking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        status_message: 'Booking failed with exception'
      })
    };
  }
};
