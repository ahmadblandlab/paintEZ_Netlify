# ClientTether Integration Guide
## VERIFIED Against Official API Documentation

## Overview

This document explains the ClientTether CRM integration with the PaintEZ appointment booking system. ClientTether works alongside TimeTap to manage customer relationships and track appointment history.

All endpoints and field names have been verified against the official ClientTether API 2.0 documentation.

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
   - Search if customer exists by phone number or email
   - Determine if repeat or new customer
   - Get client_id and full details if exists

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

## Netlify Functions

### 1. check-client.js

**Purpose:** Search for existing customer in ClientTether to identify repeat customers

**ClientTether API Endpoint Used:** `read_client_exist` (GET method)

**Netlify Function Endpoint:** `/.netlify/functions/check-client`

**Method:** POST (for Netlify function, internally uses GET to ClientTether)

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
  "client_id": "8051632",
  "external_id": "16051989",
  "client_name": "John Doe",
  "client_phone": "5551234567",
  "client_email": "customer@example.com",
  "client_address": "123 Main St",
  "client_city": "Tampa",
  "client_state": "FL",
  "client_zip": "33601",
  "message": "Existing client found - this is a repeat customer",
  "searched_by": "phone",
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
  "searched_email": "customer@example.com",
  "searched_by": "phone"
}
```

**How It Works:**
1. Searches ClientTether using `read_client_exist` API endpoint
2. First tries phone number if provided
3. Falls back to email if phone search fails or not provided
4. If client exists, fetches full details using `read_client_by_id`
5. Returns comprehensive client information

**Bland AI Usage:**
- Call this BEFORE checking appointment availability
- Use response to personalize greeting for repeat customers
- Store client_id in Bland AI variable if found

---

### 2. create-update-client.js

**Purpose:** Create new client or update existing client with appointment information

**ClientTether API Endpoints Used:**
- `create_client` (POST) - Creates new client
- `update_client_by_id` (POST) - Updates existing client

**Netlify Function Endpoint:** `/.netlify/functions/create-update-client`

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
  "appointment_id": "TT123456",
  "notes": "Optional custom notes"
}
```

**Request Body (Update Existing):**
```json
{
  "client_id": "8051632",
  "customer_first_name": "John",
  "customer_last_name": "Doe",
  "customer_phone": "555-123-4567",
  "customer_email": "john@example.com",
  "appointment_date": "2025-12-15",
  "appointment_time": "2:00 PM",
  "appointment_id": "TT123456",
  "project_type": "Exterior Painting",
  "notes": "Second appointment - previous job completed"
}
```

**Response:**
```json
{
  "success": true,
  "operation": "create",
  "client_id": "8475832",
  "external_id": "1234",
  "customer_name": "John Doe",
  "customer_phone": "555-123-4567",
  "customer_email": "john@example.com",
  "appointment_date": "2025-12-15",
  "appointment_time": "2:00 PM",
  "timetap_appointment_id": "TT123456",
  "message": "New client created successfully in ClientTether",
  "result_code": "CT_200",
  "api_response": { ... }
}
```

**Field Mapping (Verified):**

The function accepts your field names and maps them to ClientTether's required format:

| Your Field Name | ClientTether API Field | Required | Notes |
|----------------|----------------------|----------|-------|
| customer_first_name | firstName | Yes (create) | Required for new clients |
| customer_last_name | lastName | Yes (create) | Required for new clients |
| customer_phone | phone | No | Cleaned to 10 digits only |
| customer_email | email | No | Must be well-formatted |
| property_address | address | No | String |
| city | city | No | String |
| state | state | No | 2-letter abbreviation |
| zip_code | zip | No | US/CA postal codes |
| project_type | project_type | No | Custom expansion field |
| appointment_date | appointment_date | No | Custom expansion field |
| appointment_time | appointment_time | No | Custom expansion field |
| appointment_id | timetap_appointment_id | No | Custom expansion field |
| notes | whiteboard | No | Visible notes in ClientTether |
| external_id | external_id | No | Foreign key for integration |
| client_id | client_id | Yes (update) | Required for updates |

**How It Works:**
1. Validates required fields based on operation (create vs update)
2. Maps your field names to ClientTether's API format
3. Cleans phone number (removes all non-digits)
4. Adds custom fields for appointment tracking
5. Creates or updates the client record
6. Returns client_id for future reference

**Bland AI Usage:**
- Call this AFTER successfully booking in TimeTap
- Include the TimeTap appointment_id in the request
- Use client_id from check-client if updating existing customer

---

### 3. delete-client.js (NEW)

**Purpose:** Delete test clients from ClientTether for cleanup

**ClientTether API Endpoints Used:**
- `delete_client_by_id` (DELETE)
- `delete_client_by_external_id` (DELETE)

**Netlify Function Endpoint:** `/.netlify/functions/delete-client`

**Method:** POST or DELETE

**Request Body:**
```json
{
  "client_id": "8475832"
}
```

OR

```json
{
  "external_id": "1234"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Client deleted successfully from ClientTether",
  "deleted_by": "client_id",
  "client_id": "8475832",
  "external_id": null,
  "result_code": "CT200",
  "api_response": { ... }
}
```

**Response (Failure - Client In Use):**
```json
{
  "success": false,
  "message": "Delete operation failed",
  "result_code": "CT512",
  "api_response": { ... },
  "hint": "Client may not exist or may be in use elsewhere in the system"
}
```

**Important Notes:**
- ClientTether may return CT512 if client is still in use (e.g., has appointments, action plans, etc.)
- You must delete or remove associated data before deleting the client
- Use this function for cleaning up test data only
- Cannot be undone - client data is permanently deleted

**Usage:**
- Primarily for development and testing
- Clean up test clients after testing Bland AI integration
- Provide either client_id or external_id

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
- timetap_appointment_id (from book-appointment response)

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
  Set customer_first_name = response.client_name (split first part)
  Set customer_last_name = response.client_name (split last part)
  Set customer_email = response.client_email
  AI: "Welcome back {{response.client_name}}! Great to hear from you again."
Else:
  Set client_exists = false
  AI: "Great! Let me get some information from you."
```

**Node 3: Collect Information**
```
If client_exists == false:
  AI: "May I have your first name?"
  Save to: customer_first_name

  AI: "And your last name?"
  Save to: customer_last_name

  AI: "What's your email address?"
  Save to: customer_email

  AI: "What's the address for the project?"
  Save to: property_address

  AI: "And the zip code?"
  Save to: zip_code
Else:
  AI: "I have your information on file. What's the address for this project?"
  Collect: property_address, zip_code
```

**Node 4: Validate Zipcode**
```
(Existing flow - no changes)
POST to: https://your-site.netlify.app/.netlify/functions/validate-zipcode
```

**Node 5: Collect Project Type**
```
AI: "What type of painting project is this?"
Save to: project_type
```

**Node 6: Collect Appointment Date**
```
AI: "What date would you like to schedule the appointment?"
Save to: requested_appointment_date
```

**Node 7: Check Availability**
```
(Existing flow - no changes)
POST to: https://your-site.netlify.app/.netlify/functions/check-availability
```

**Node 8: Book Appointment**
```
(Existing flow - no changes)
POST to: https://your-site.netlify.app/.netlify/functions/book-appointment
Save response.appointment_id to: timetap_appointment_id
```

**Node 9: Update ClientTether (NEW)**
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
  "city": "",
  "state": "",
  "zip_code": "{{zip_code}}",
  "project_type": "{{project_type}}",
  "appointment_date": "{{requested_appointment_date}}",
  "appointment_time": "{{confirmed_appointment_time}}",
  "appointment_id": "{{timetap_appointment_id}}"
}

Note: If client_id is empty (new customer), it will create.
      If client_id exists (repeat customer), it will update.
```

**Node 10: Confirmation**
```
AI: "Perfect! Your appointment is confirmed for {{confirmed_appointment_time}} on {{requested_appointment_date}}. You'll receive a confirmation text shortly. Is there anything else I can help you with?"
```

---

## Configuration

### API Credentials

Located in all three functions:
```javascript
const CLIENTTETHER_CONFIG = {
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
  webKey: 'CT_574bf374ca11e449b9b6ffd83d71e341',
  baseUrl: 'https://api.clienttether.com/v2/api'
};
```

### Security Recommendations

These credentials are currently hardcoded. For production, you should:

1. Move credentials to Netlify Environment Variables
2. In Netlify Dashboard: Site Settings > Environment Variables > Add variables
3. Set these variables:
   - `CLIENTTETHER_ACCESS_TOKEN`
   - `CLIENTTETHER_WEB_KEY`
4. Update functions to use:
   ```javascript
   accessToken: process.env.CLIENTTETHER_ACCESS_TOKEN,
   webKey: process.env.CLIENTTETHER_WEB_KEY
   ```

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

**Delete Client:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/delete-client \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "8475832"
  }'
```

---

## API Documentation Reference

**Official Documentation:**
- ClientTether API 2.0: https://support.clienttether.com/api-document/clienttether-api-2-0-doc/
- Postman Collection: https://documenter.getpostman.com/view/34603208/2sB3BEoW7A

**API Endpoints Used:**
- GET `https://api.clienttether.com/v2/api/read_client_exist?phone=3039291447`
- GET `https://api.clienttether.com/v2/api/read_client_by_id/1234`
- POST `https://api.clienttether.com/v2/api/create_client`
- POST `https://api.clienttether.com/v2/api/update_client_by_id`
- DELETE `https://api.clienttether.com/v2/api/delete_client_by_id`
- DELETE `https://api.clienttether.com/v2/api/delete_client_by_external_id`

**Response Codes:**
- CT_200 / CT200: Success
- CT515: No Record Found
- CT512: Cannot delete - parameter still in use
- CT400: Bad Request
- CT404: Request Not Found
- CT500: Unknown Error
- CT501: Missing Required Key:Value Pair(s)
- CT520: Duplicate Entry
- CT525: Insert Failed

---

## Troubleshooting

### Common Issues

**1. Authentication Errors (401/403)**
- Verify X-Access-Token is correct and hasn't expired
- Verify X-Web-Key matches your account
- Check that both headers are being sent
- Access token is Enterprise-level, must match your credentials

**2. Client Not Found (CT515)**
- Phone number must be exactly 10 digits
- Email must be exact match (case-sensitive)
- Try searching by alternate identifier
- Client may have been deleted

**3. Create/Update Fails (CT501)**
- firstName and lastName are required for create
- client_id is required for update
- Phone must be 10 digits only (no formatting)
- Email must be well-formatted

**4. Delete Fails (CT512)**
- Client has active appointments, action plans, or other associations
- Must remove all associations before deleting
- Check for: pending events, action plans, sales cycles, history notes

**5. Duplicate Entry (CT520)**
- Enable duplicate check in ClientTether Settings > API tab
- Search for existing client before creating
- Use external_id to prevent duplicates from your system

### Debug Mode

Enable detailed logging in Netlify Dashboard:
1. Go to Functions tab
2. Select the function
3. View real-time logs
4. Look for console.log outputs showing requests and responses

All functions include detailed console.log statements:
```javascript
console.log('Request payload:', JSON.stringify(payload, null, 2));
console.log('API response:', JSON.stringify(result, null, 2));
```

---

## Deployment

After creating or modifying functions:

```bash
# Add new files
git add netlify/functions/check-client.js
git add netlify/functions/create-update-client.js
git add netlify/functions/delete-client.js
git add CLIENTTETHER_INTEGRATION.md

# Commit with descriptive message
git commit -m "Add verified ClientTether integration functions"

# Push to your branch
git push origin your-branch-name

# Netlify will automatically deploy
# Functions available at:
# https://your-site.netlify.app/.netlify/functions/check-client
# https://your-site.netlify.app/.netlify/functions/create-update-client
# https://your-site.netlify.app/.netlify/functions/delete-client
```

---

## Summary

### What's Working

All three functions have been verified against the official ClientTether API 2.0 documentation:

1. **check-client.js** - Uses correct `read_client_exist` GET endpoint
2. **create-update-client.js** - Uses correct field names (firstName, lastName, etc.)
3. **delete-client.js** - Uses correct `delete_client_by_id` DELETE endpoint

### Integration Benefits

- Identify repeat customers automatically
- Personalized greetings for returning clients
- Complete customer history tracking
- Appointment records stored in CRM
- Easy test data cleanup with delete function

### Next Steps

1. Test each function individually with cURL
2. Update Bland AI pathway with new nodes
3. Conduct end-to-end testing with test calls
4. Monitor Netlify function logs during testing
5. Move credentials to environment variables for production
6. Enable duplicate checking in ClientTether settings

---

## Support

For ClientTether API issues:
- Support: https://support.clienttether.com
- API Documentation: https://support.clienttether.com/api-document/clienttether-api-2-0-doc/

For Netlify deployment issues:
- Netlify Dashboard: Functions tab for logs
- Check build logs for deployment errors
