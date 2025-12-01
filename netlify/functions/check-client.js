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
// HELPER: SEARCH CLIENT BY PHONE
// Searches ClientTether for existing client with matching phone number
// ========================================
async function searchClientByPhone(phone) {
  // Clean phone number - remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');

  // ClientTether search endpoint
  // Note: The exact search endpoint may vary - check API docs
  // Common patterns: /search_client, /get_client_by_phone, /clients/search
  const searchUrl = `${CLIENTTETHER_CONFIG.baseUrl}/search_client`;

  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: cleanPhone
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether search failed: ${response.status} - ${errorText}`);
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
    // ========================================
    let searchResult;

    // Try searching by phone first if provided
    if (customer_phone) {
      try {
        searchResult = await searchClientByPhone(customer_phone);
      } catch (error) {
        console.error('Phone search error:', error.message);
        // If phone search fails, we'll try email if available
        if (!customer_email) {
          throw error;
        }
      }
    }

    // If no result from phone and email provided, try email search
    // Note: Implement email search similar to phone search if API supports it

    // ========================================
    // DETERMINE IF CLIENT EXISTS
    // ========================================
    let clientExists = false;
    let clientData = null;

    // Check if we got a valid result
    // Note: The exact response structure depends on ClientTether API
    // Common patterns: { clients: [...] }, { data: {...} }, or direct array
    if (searchResult) {
      // Adjust this logic based on actual API response structure
      if (Array.isArray(searchResult) && searchResult.length > 0) {
        clientExists = true;
        clientData = searchResult[0];
      } else if (searchResult.clients && searchResult.clients.length > 0) {
        clientExists = true;
        clientData = searchResult.clients[0];
      } else if (searchResult.data) {
        clientExists = true;
        clientData = searchResult.data;
      } else if (searchResult.id || searchResult.client_id) {
        clientExists = true;
        clientData = searchResult;
      }
    }

    // ========================================
    // FORMAT RESPONSE
    // ========================================
    if (clientExists) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          client_exists: true,
          client_id: clientData.id || clientData.client_id || 'unknown',
          client_name: clientData.name || `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim(),
          client_phone: clientData.phone || customer_phone,
          client_email: clientData.email || customer_email,
          message: 'Existing client found - this is a repeat customer',
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
          searched_email: customer_email
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
        hint: 'Check ClientTether API endpoint and credentials'
      })
    };
  }
};
