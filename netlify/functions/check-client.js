// netlify/functions/check-client.js

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
// HELPER: SEARCH CLIENT BY PHONE OR EMAIL
// Uses read_client_exist endpoint to check if client exists
// API responds with client_id if found, or "No Record Found" if not
// ========================================
async function searchClientByPhone(phone) {
  // Clean phone number - remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');

  // Build GET request URL with query parameters
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
    const errorText = await response.text();
    throw new Error(`ClientTether search failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result;
}

// ========================================
// HELPER: SEARCH CLIENT BY EMAIL
// Uses read_client_exist endpoint to check if client exists
// ========================================
async function searchClientByEmail(email) {
  // Build GET request URL with query parameters
  const searchUrl = `${CLIENTTETHER_CONFIG.baseUrl}/read_client_exist?email=${encodeURIComponent(email)}`;

  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether search failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result;
}

// ========================================
// HELPER: GET FULL CLIENT DETAILS
// Uses read_client_by_id to get complete client information
// ========================================
async function getClientById(clientId) {
  const readUrl = `${CLIENTTETHER_CONFIG.baseUrl}/read_client_by_id/${clientId}`;

  const response = await fetch(readUrl, {
    method: 'GET',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether read failed: ${response.status} - ${errorText}`);
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
    const { customer_phone, customer_email } = body;

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
          hint: 'Provide at least one identifier to search for the client'
        })
      };
    }

    console.log(`Searching for client with phone: ${customer_phone || 'N/A'}, email: ${customer_email || 'N/A'}`);

    // ========================================
    // SEARCH FOR EXISTING CLIENT
    // Try phone first if provided, then email
    // ========================================
    let searchResult = null;
    let searchMethod = null;

    // Try searching by phone first if provided
    if (customer_phone) {
      try {
        searchResult = await searchClientByPhone(customer_phone);
        searchMethod = 'phone';
        console.log('Phone search result:', JSON.stringify(searchResult));
      } catch (error) {
        console.error('Phone search error:', error.message);
        // If phone search fails and email available, try email
        if (!customer_email) {
          throw error;
        }
      }
    }

    // If no result from phone and email provided, try email search
    if (!searchResult && customer_email) {
      try {
        searchResult = await searchClientByEmail(customer_email);
        searchMethod = 'email';
        console.log('Email search result:', JSON.stringify(searchResult));
      } catch (error) {
        console.error('Email search error:', error.message);
        throw error;
      }
    }

    // ========================================
    // PARSE SEARCH RESULT
    // API returns CT_200 with data if found, or CT515 if not found
    // ========================================
    let clientExists = false;
    let clientData = null;

    // Check result code
    // Success response: {"ResultCode":"CT_200","Message":"Success","TotalRecord":1,"data":[{"client_id":"8051632","external_id":"16051989"}]}
    // Not found response: {"resultCode":"CT515", "Message":"No Record Found", "client_id": false, "external_id":"..."}
    if (searchResult) {
      const resultCode = searchResult.ResultCode || searchResult.resultCode;

      if (resultCode === 'CT_200' || resultCode === 'CT200') {
        // Client exists
        clientExists = true;

        // Extract client_id from response
        if (searchResult.data && Array.isArray(searchResult.data) && searchResult.data.length > 0) {
          const clientId = searchResult.data[0].client_id;

          // Get full client details
          try {
            const fullClientData = await getClientById(clientId);
            if (fullClientData.data && Array.isArray(fullClientData.data) && fullClientData.data.length > 0) {
              clientData = fullClientData.data[0];
            } else {
              // If full data not available, use what we have
              clientData = searchResult.data[0];
            }
          } catch (error) {
            console.error('Error fetching full client data:', error.message);
            // Use basic data from search
            clientData = searchResult.data[0];
          }
        }
      } else if (resultCode === 'CT515') {
        // Client does not exist
        clientExists = false;
      }
    }

    // ========================================
    // FORMAT RESPONSE
    // ========================================
    if (clientExists && clientData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          client_exists: true,
          client_id: clientData.client_id || 'unknown',
          external_id: clientData.external_id || null,
          client_name: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim(),
          client_phone: clientData.phone || customer_phone,
          client_email: clientData.email || customer_email,
          client_address: clientData.address || null,
          client_city: clientData.city || null,
          client_state: clientData.state || null,
          client_zip: clientData.zip || null,
          message: 'Existing client found - this is a repeat customer',
          searched_by: searchMethod,
          full_client_data: clientData
        })
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          client_exists: false,
          message: 'No existing client found - this is a new customer',
          searched_phone: customer_phone,
          searched_email: customer_email,
          searched_by: searchMethod
        })
      };
    }

  } catch (error) {
    console.error('Client check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        hint: 'Check ClientTether API endpoint and credentials. Verify X-Access-Token and X-Web-Key are correct.'
      })
    };
  }
};
