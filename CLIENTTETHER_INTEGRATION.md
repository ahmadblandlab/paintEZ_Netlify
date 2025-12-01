# ClientTether Integration Guide

## Overview

This document explains the ClientTether CRM integration with the PaintEZ appointment booking system. ClientTether works alongside TimeTap to manage customer relationships and track appointment history.

## System Architecture

### Two Parallel Systems

**TimeTap** - Appointment Scheduling
- Manages calendar and time slots
- Books appointments
- Sends reminders

**ClientTether** - Customer Relationship Management
- Stores customer information
- Tracks interaction history
- Identifies repeat customers

### Integration Flow

```
1. Customer calls Bland AI
2. Collect customer info (name, phone, address, etc.)

3. CHECK CLIENT (ClientTether)
   - Search if customer exists by phone number
   - Determine if repeat or new customer
   - Get client_id if exists

4. VALIDATE ZIPCODE
   - Determine franchise location

5. CHECK AVAILABILITY (TimeTap)
   - Get available appointment slots

6. Customer selects time

7. BOOK APPOINTMENT (TimeTap)
   - Create appointment in TimeTap calendar

8. CREATE/UPDATE CLIENT (ClientTether)
   - If new: Create client record with appointment details
   - If repeat: Update existing record with new appointment
```

## New Netlify Functions

### 1. check-client.js

**Purpose:** Search for existing customer in ClientTether to identify repeat customers

**Endpoint:** `/.netlify/functions/check-client`

**Method:** POST

**Request Body:**
```json
{
  "customer_phone": "555-123-4567",
  "customer_email": "customer@example.com"
}
```

**Response (Client Exists):**
```json
{
  "success": true,
  "client_exists": true,
  "client_id": "12345",
  "client_name": "John Doe",
  "client_phone": "5551234567",
  "client_email": "customer@example.com",
  "message": "Existing client found - this is a repeat customer",
  "full_client_data": { ... }
}
```

**Response (New Client):**
```json
{
  "success": true,
  "client_exists": false,
  "message": "No existing client found - this is a new customer",
  "searched_phone": "5551234567",
  "searched_email": "customer@example.com"
}
```

**Bland AI Usage:**
- Call this BEFORE checking appointment availability
- Use response to personalize greeting for repeat customers
- Store client_id in Bland AI variable if found

---

### 2. create-update-client.js

**Purpose:** Create new client or update existing client with appointment information

**Endpoint:** `/.netlify/functions/create-update-client`

**Method:** POST

**Request Body (Create New):**
```json
{
  "customer_first_name": "John",
  "customer_last_name": "Doe",
  "customer_phone": "555-123-4567",
  "customer_email": "john@example.com",
  "property_address": "123 Main St",
  "city": "Tampa",
  "state": "FL",
  "zip_code": "33601",
  "project_type": "Interior Painting",
  "appointment_date": "2025-12-15",
  "appointment_time": "2:00 PM",
  "appointment_id": "TT123456"
}
```

**Request Body (Update Existing):**
```json
{
  "client_id": "12345",
  "customer_first_name": "John",
  "customer_last_name": "Doe",
  "customer_phone": "555-123-4567",
  "appointment_date": "2025-12-15",
  "appointment_time": "2:00 PM",
  "appointment_id": "TT123456",
  "project_type": "Exterior Painting",
  "notes": "Second appointment - previous job completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "operation": "create",
  "client_id": "12345",
  "customer_name": "John Doe",
  "customer_phone": "555-123-4567",
  "appointment_date": "2025-12-15",
  "appointment_time": "2:00 PM",
  "timetap_appointment_id": "TT123456",
  "message": "New client created successfully in ClientTether",
  "api_response": { ... }
}
```

**Bland AI Usage:**
- Call this AFTER successfully booking in TimeTap
- Include the TimeTap appointment_id in the request
- Use client_id from check-client if updating existing customer

---

## Bland AI Pathway Integration

### Required Variables

Add these to your Bland AI pathway:

**Existing (TimeTap):**
- location_id
- requested_appointment_date
- confirmed_appointment_time
- customer_first_name
- customer_last_name
- customer_phone
- property_address
- zip_code
- project_type

**New (ClientTether):**
- client_id (set from check-client response)
- client_exists (boolean from check-client)
- customer_email (optional but recommended)

### Updated Pathway Flow

**Node 1: Greeting**
```
AI: "Thank you for calling PaintEZ. May I have your phone number?"
Save response to: customer_phone
```

**Node 2: Check Client (NEW)**
```
Wait for Response: Enabled
POST to: https://your-site.netlify.app/.netlify/functions/check-client
Body: {
  "customer_phone": "{{customer_phone}}"
}

If response.client_exists == true:
  Set client_id = response.client_id
  Set client_exists = true
  AI: "Welcome back {{response.client_name}}! Great to hear from you again."
Else:
  Set client_exists = false
  AI: "Great! Let me get some information from you."
```

**Node 3: Collect Information**
```
If client_exists == false:
  Collect: first_name, last_name, email, address, zip_code
Else:
  AI: "I have your information on file. What's the address for this project?"
  Collect: property_address, zip_code
```

**Node 4: Validate Zipcode**
```
(Existing flow - no changes)
```

**Node 5: Collect Project Type**
```
AI: "What type of painting project is this?"
Save to: project_type
```

**Node 6: Check Availability**
```
(Existing flow - no changes)
```

**Node 7: Book Appointment**
```
(Existing flow - no changes)
Save response.appointment_id to: timetap_appointment_id
```

**Node 8: Update ClientTether (NEW)**
```
Wait for Response: Enabled
POST to: https://your-site.netlify.app/.netlify/functions/create-update-client
Body: {
  "client_id": "{{client_id}}",
  "customer_first_name": "{{customer_first_name}}",
  "customer_last_name": "{{customer_last_name}}",
  "customer_phone": "{{customer_phone}}",
  "customer_email": "{{customer_email}}",
  "property_address": "{{property_address}}",
  "zip_code": "{{zip_code}}",
  "project_type": "{{project_type}}",
  "appointment_date": "{{requested_appointment_date}}",
  "appointment_time": "{{confirmed_appointment_time}}",
  "appointment_id": "{{timetap_appointment_id}}"
}
```

**Node 9: Confirmation**
```
AI: "Perfect! Your appointment is confirmed for {{confirmed_appointment_time}} on {{requested_appointment_date}}. You'll receive a confirmation text shortly. Is there anything else I can help you with?"
```

---

## Configuration

### API Credentials

Located in both functions:
```javascript
const CLIENTTETHER_CONFIG = {
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
  webKey: 'CT_574bf374ca11e449b9b6ffd83d71e341',
  baseUrl: 'https://api.clienttether.com/v2/api'
};
```

### Security Note

These credentials are currently hardcoded. For production, consider:
1. Moving credentials to Netlify Environment Variables
2. Using Netlify's UI: Site Settings > Environment Variables
3. Access via `process.env.CLIENTTETHER_ACCESS_TOKEN`

---

## Testing

### Test with cURL

**Check Client:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/check-client \
  -H "Content-Type: application/json" \
  -d '{
    "customer_phone": "5551234567"
  }'
```

**Create Client:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/create-update-client \
  -H "Content-Type: application/json" \
  -d '{
    "customer_first_name": "Test",
    "customer_last_name": "Customer",
    "customer_phone": "5551234567",
    "customer_email": "test@example.com",
    "property_address": "123 Test St",
    "zip_code": "33601",
    "project_type": "Test Project",
    "appointment_date": "2025-12-15",
    "appointment_time": "2:00 PM",
    "appointment_id": "TEST123"
  }'
```

---

## API Documentation References

- **ClientTether API Docs:** https://support.clienttether.com/api-document/clienttether-api-2-0-doc/
- **Create Client:** https://api.clienttether.com/v2/api/create_client
- **Update Client:** https://api.clienttether.com/v2/api/update_client_by_id

---

## Important Notes

### 1. API Endpoint Verification

The search endpoint in check-client.js may need adjustment:
```javascript
// Current assumption:
const searchUrl = `${CLIENTTETHER_CONFIG.baseUrl}/search_client`;

// Verify actual endpoint in ClientTether docs
// Could be: /get_client_by_phone, /clients/search, etc.
```

### 2. Response Format

ClientTether API response structures may vary. Both functions include logic to handle common patterns:
- Direct arrays: `[{client}, {client}]`
- Wrapped arrays: `{clients: [{client}]}`
- Single objects: `{data: {client}}`
- Direct object: `{id: 123, name: "..."}`

Adjust parsing logic based on actual API responses.

### 3. Field Mapping

Current field names are assumptions. Verify with actual ClientTether API:
- first_name vs firstName
- phone vs cell_phone
- address vs street_address
- etc.

### 4. Delete Endpoint

Not yet implemented. Once Delaine provides the delete endpoint:
```javascript
// Future: delete-client.js
async function deleteClient(clientId) {
  const deleteUrl = `${CLIENTTETHER_CONFIG.baseUrl}/delete_client`;
  // Implementation here
}
```

---

## Deployment

After creating/modifying functions:

```bash
# Deploy to Netlify
git add netlify/functions/check-client.js
git add netlify/functions/create-update-client.js
git commit -m "Add ClientTether integration functions"
git push origin claude/code-review-summary-012YbHRzxwfjoaygfqQavyek

# Netlify will automatically deploy
# Functions available at:
# https://your-site.netlify.app/.netlify/functions/check-client
# https://your-site.netlify.app/.netlify/functions/create-update-client
```

---

## Troubleshooting

### Common Issues

**1. Authentication Errors**
- Verify X-Access-Token and X-Web-Key are correct
- Check if tokens have expired
- Ensure headers are properly set

**2. Client Not Found**
- Phone number formatting (remove all non-digits)
- Email case sensitivity
- Search endpoint may have different query format

**3. Create/Update Fails**
- Required fields missing
- Field name mismatch
- Data type validation (strings vs numbers)

### Debug Mode

Enable detailed logging:
```javascript
console.log('Request payload:', JSON.stringify(payload, null, 2));
console.log('API response:', JSON.stringify(result, null, 2));
```

Check Netlify Function Logs:
- Netlify Dashboard > Functions > Select function > View logs

---

## Next Steps

1. Test check-client.js with actual ClientTether API
2. Verify search endpoint and response format
3. Test create-update-client.js with sample data
4. Adjust field mappings based on API documentation
5. Implement delete-client.js once endpoint is confirmed
6. Update Bland AI pathway with new nodes
7. Conduct end-to-end testing
8. Move credentials to environment variables for production
