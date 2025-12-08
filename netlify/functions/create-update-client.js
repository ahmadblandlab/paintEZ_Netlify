// netlify/functions/create-update-client.js

// ========================================
// CLIENTTETHER API CONFIGURATION
// Credentials for authenticating with ClientTether CRM
// ========================================
const CLIENTTETHER_CONFIG = {
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqYXNvbmFsbGVuIiwicm9sZSI6IjUiLCJvcmlnaW4iOiIxIn0.ej3zJE5Ju6rAdU0XctXW-KjS8l52pPdbkEEsDQhPzDc',
  webKey: 'CT_574bf374ca11e449b9b6ffd83d71e341',
  baseUrl: 'https://api.clienttether.com/v2/api'
};

// ========================================
// HELPER: CREATE NEW CLIENT
// Creates a new client record in ClientTether
// API Endpoint: create_client
// Required fields: firstName, lastName
// ========================================
async function createClient(clientData) {
  const createUrl = `${CLIENTTETHER_CONFIG.baseUrl}/create_client`;

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether create failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result;
}

// ========================================
// HELPER: UPDATE EXISTING CLIENT BY ID
// Updates an existing client record in ClientTether
// API Endpoint: update_client_by_id
// Required field: client_id
// ========================================
async function updateClientById(clientId, clientData) {
  const updateUrl = `${CLIENTTETHER_CONFIG.baseUrl}/update_client_by_id`;

  const response = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      ...clientData
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether update failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result;
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

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST requests
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
      client_id,
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_email,
      property_address,
      city,
      state,
      zip_code,
      project_type,
      appointment_date,
      appointment_time,
      appointment_id,
      notes,
      external_id
    } = body;

    // ========================================
    // VALIDATE INPUT
    // For create: firstName and lastName are required
    // For update: client_id is required
    // ========================================
    if (!client_id && (!customer_first_name || !customer_last_name)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters',
          hint: 'For new clients: customer_first_name and customer_last_name are required. For updates: client_id is required.'
        })
      };
    }

    // ========================================
    // BUILD CLIENT PAYLOAD
    // Using ClientTether API field names from documentation:
    // firstName, lastName, phone, email, address, city, state, zip
    // Custom fields: any non-reserved parameter name accepted as String
    // ========================================
    const clientPayload = {};

    // Standard ClientTether fields
    if (customer_first_name) clientPayload.firstName = customer_first_name;
    if (customer_last_name) clientPayload.lastName = customer_last_name;
    if (customer_phone) {
      // Clean phone - 10 digits only, no formatting
      clientPayload.phone = customer_phone.replace(/\D/g, '');
    }
    if (customer_email) clientPayload.email = customer_email;
    if (property_address) clientPayload.address = property_address;
    if (city) clientPayload.city = city;
    if (state) clientPayload.state = state;
    if (zip_code) clientPayload.zip = zip_code;
    if (external_id) clientPayload.external_id = external_id;

    // Custom expansion fields
    // ClientTether accepts any non-reserved parameter name as a String
    if (project_type) clientPayload.project_type = project_type;
    if (appointment_date) clientPayload.appointment_date = appointment_date;
    if (appointment_time) clientPayload.appointment_time = appointment_time;
    if (appointment_id) clientPayload.timetap_appointment_id = appointment_id;

    // Whiteboard field - visible notes in ClientTether
    if (notes) {
      clientPayload.whiteboard = notes;
    } else if (appointment_date && appointment_time) {
      // Generate default note
      clientPayload.whiteboard = `Appointment booked via Bland AI on ${appointment_date} at ${appointment_time}. Project: ${project_type || 'Not specified'}. TimeTap ID: ${appointment_id || 'N/A'}`;
    }

    console.log('Client payload:', JSON.stringify(clientPayload, null, 2));

    // ========================================
    // CREATE OR UPDATE CLIENT
    // ========================================
    let result;
    let operation;
    let returnedClientId;

    if (client_id) {
      // Update existing client
      console.log(`Updating existing client: ${client_id}`);
      operation = 'update';
      result = await updateClientById(client_id, clientPayload);

      // Response format: {"resultCode":"CT200", "Message":"Success"}
      // Plus all client data fields returned
      returnedClientId = client_id;
    } else {
      // Create new client
      console.log('Creating new client');
      operation = 'create';
      result = await createClient(clientPayload);

      // Response format: {"ResultCode":"CT_200","Message":"Success","TotalRecord":1,"data":[{"client_id":"8475832","external_id":"1234"}]}
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        returnedClientId = result.data[0].client_id;
      } else {
        returnedClientId = 'unknown';
      }
    }

    // ========================================
    // FORMAT RESPONSE
    // ========================================
    const resultCode = result.ResultCode || result.resultCode;
    const success = (resultCode === 'CT_200' || resultCode === 'CT200');

    return {
      statusCode: success ? 200 : 400,
      headers,
      body: JSON.stringify({
        success: success,
        operation: operation,
        client_id: returnedClientId,
        external_id: result.data?.[0]?.external_id || external_id || null,
        customer_name: `${customer_first_name || ''} ${customer_last_name || ''}`.trim(),
        customer_phone: customer_phone,
        customer_email: customer_email,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        timetap_appointment_id: appointment_id,
        message: success
          ? (operation === 'create'
            ? 'New client created successfully in ClientTether'
            : 'Existing client updated successfully in ClientTether')
          : 'Operation failed - see api_response for details',
        result_code: resultCode,
        api_response: result
      })
    };

  } catch (error) {
    console.error('Client create/update error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        hint: 'Check ClientTether API endpoint, credentials, and payload format. Verify X-Access-Token and X-Web-Key are correct.'
      })
    };
  }
};
