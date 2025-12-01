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
// HELPER: UPDATE EXISTING CLIENT
// Updates an existing client record in ClientTether
// ========================================
async function updateClient(clientId, clientData) {
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
      notes
    } = body;

    // ========================================
    // VALIDATE INPUT
    // ========================================
    if (!customer_phone && !customer_email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameter: customer_phone or customer_email',
          hint: 'Provide at least one contact method for the client'
        })
      };
    }

    if (!customer_first_name && !customer_last_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameter: customer_first_name or customer_last_name',
          hint: 'Provide at least customer name'
        })
      };
    }

    // ========================================
    // BUILD CLIENT PAYLOAD
    // Adjust field names based on actual ClientTether API requirements
    // ========================================
    const clientPayload = {
      first_name: customer_first_name || '',
      last_name: customer_last_name || '',
      phone: customer_phone || '',
      email: customer_email || '',
      address: property_address || '',
      city: city || '',
      state: state || '',
      zip: zip_code || '',
      // Custom fields for appointment information
      project_type: project_type || '',
      appointment_date: appointment_date || '',
      appointment_time: appointment_time || '',
      timetap_appointment_id: appointment_id || '',
      notes: notes || `Appointment booked via Bland AI on ${appointment_date} at ${appointment_time}. Project: ${project_type || 'Not specified'}.`
    };

    console.log('Client payload:', JSON.stringify(clientPayload, null, 2));

    // ========================================
    // CREATE OR UPDATE CLIENT
    // ========================================
    let result;
    let operation;

    if (client_id) {
      // Update existing client
      console.log(`Updating existing client: ${client_id}`);
      operation = 'update';
      result = await updateClient(client_id, clientPayload);
    } else {
      // Create new client
      console.log('Creating new client');
      operation = 'create';
      result = await createClient(clientPayload);
    }

    // ========================================
    // FORMAT RESPONSE
    // ========================================
    // Extract client ID from response
    // Note: Adjust based on actual API response structure
    const returnedClientId = result.id || result.client_id || result.data?.id || client_id || 'unknown';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        operation: operation,
        client_id: returnedClientId,
        customer_name: `${customer_first_name} ${customer_last_name}`,
        customer_phone: customer_phone,
        customer_email: customer_email,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        timetap_appointment_id: appointment_id,
        message: operation === 'create'
          ? 'New client created successfully in ClientTether'
          : 'Existing client updated successfully in ClientTether',
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
        hint: 'Check ClientTether API endpoint, credentials, and payload format'
      })
    };
  }
};
