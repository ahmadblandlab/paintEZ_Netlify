// netlify/functions/delete-client.js

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
// HELPER: DELETE CLIENT BY ID
// Deletes a client record from ClientTether
// API Endpoint: delete_client_by_id
// Method: DELETE
// Required field: client_id
// ========================================
async function deleteClientById(clientId) {
  const deleteUrl = `${CLIENTTETHER_CONFIG.baseUrl}/delete_client_by_id`;

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether delete failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result;
}

// ========================================
// HELPER: DELETE CLIENT BY EXTERNAL ID
// Deletes a client record from ClientTether using external_id
// API Endpoint: delete_client_by_external_id
// Method: DELETE
// Required field: external_id
// ========================================
async function deleteClientByExternalId(externalId) {
  const deleteUrl = `${CLIENTTETHER_CONFIG.baseUrl}/delete_client_by_external_id`;

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
      'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      external_id: externalId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClientTether delete failed: ${response.status} - ${errorText}`);
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
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Allow both POST and DELETE methods
  // POST for consistency with other Netlify functions
  // DELETE for REST compliance
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST or DELETE.' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { client_id, external_id } = body;

    // ========================================
    // VALIDATE INPUT
    // Require either client_id or external_id
    // ========================================
    if (!client_id && !external_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameter: client_id or external_id',
          hint: 'Provide either client_id or external_id to delete a client'
        })
      };
    }

    // ========================================
    // DELETE CLIENT
    // Use client_id if provided, otherwise use external_id
    // ========================================
    let result;
    let deletedBy;

    if (client_id) {
      console.log(`Deleting client by ID: ${client_id}`);
      result = await deleteClientById(client_id);
      deletedBy = 'client_id';
    } else {
      console.log(`Deleting client by external ID: ${external_id}`);
      result = await deleteClientByExternalId(external_id);
      deletedBy = 'external_id';
    }

    // ========================================
    // FORMAT RESPONSE
    // Expected response: {"resultCode":"CT200", "Message":"Success"}
    // ========================================
    const resultCode = result.ResultCode || result.resultCode;
    const success = (resultCode === 'CT_200' || resultCode === 'CT200');

    if (success) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Client deleted successfully from ClientTether',
          deleted_by: deletedBy,
          client_id: client_id || null,
          external_id: external_id || null,
          result_code: resultCode,
          api_response: result
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Delete operation failed',
          result_code: resultCode,
          api_response: result,
          hint: 'Client may not exist or may be in use elsewhere in the system'
        })
      };
    }

  } catch (error) {
    console.error('Client delete error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        hint: 'Check ClientTether API endpoint and credentials. Verify X-Access-Token and X-Web-Key are correct. Note: API may return CT512 if client is still in use.'
      })
    };
  }
};
