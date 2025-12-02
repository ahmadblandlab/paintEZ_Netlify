# PaintEZ Multi-Location Appointment & CRM System

**Automated appointment booking system integrating Bland AI with TimeTap scheduling and ClientTether CRM**

**Live System:** `https://paintez-bland.netlify.app`

---

## What This System Does

**For Customers:**
1. Customer calls PaintEZ franchise → Bland AI answers
2. AI collects project details and preferred date
3. System checks TimeTap for real-time availability
4. Customer picks a time → Appointment booked automatically
5. Customer data synced to ClientTether CRM
6. Confirmation sent!

**For Franchises:**
- 24/7 automated booking across unlimited locations
- Automatic CRM customer tracking
- No manual data entry

---

## System Architecture

```
Customer Call
    ↓
Bland AI (Conversational)
    ↓
Netlify Functions (API Layer)
    ↓
    ├─→ TimeTap API (Appointments)
    └─→ ClientTether API (CRM)
```

---

## API Endpoints

**Base URL:** `https://paintez-bland.netlify.app/.netlify/functions/`

### TimeTap Integration (Appointment Scheduling)

#### 1. Check Availability
**Endpoint:** `check-availability`
**Method:** POST

**Request:**
```json
{
  "location_id": "paintez_north_tampa",
  "requested_appointment_date": "2025-12-20"
}
```

**Response:**
```json
{
  "available_times": "9:00 AM, 2:00 PM, 4:00 PM",
  "success": true,
  "location_id": "paintez_north_tampa"
}
```

---

#### 2. Book Appointment
**Endpoint:** `book-appointment`
**Method:** POST

**Request:**
```json
{
  "location_id": "paintez_north_tampa",
  "customer_first_name": "Sarah",
  "customer_last_name": "Johnson",
  "customer_phone": "555-123-4567",
  "property_address": "123 Main St",
  "zip_code": "90210",
  "requested_appointment_date": "2025-12-20",
  "confirmed_appointment_time": "2:00 PM",
  "project_type": "Interior painting"
}
```

**Response:**
```json
{
  "success": true,
  "appointment_id": "190504898",
  "confirmation_number": "xY9kL2m",
  "clienttether_synced": true,
  "clienttether_client_id": "27918675"
}
```

**Note:** Automatically syncs customer data to ClientTether CRM

---

### ClientTether Integration (CRM)

#### 3. Check Client
**Endpoint:** `check-client`
**Method:** POST

**Request:**
```json
{
  "customer_phone": "555-123-4567"
}
```
OR
```json
{
  "customer_email": "sarah@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "client_exists": true,
  "client_id": "27918675",
  "customer_name": "Sarah Johnson",
  "phone": "5551234567",
  "address": "123 Main St"
}
```

**Use Case:** Check if customer already exists before creating duplicate records

---

#### 4. Create/Update Client
**Endpoint:** `create-update-client`
**Method:** POST

**Request:**
```json
{
  "customer_first_name": "Sarah",
  "customer_last_name": "Johnson",
  "customer_phone": "555-123-4567",
  "property_address": "123 Main St",
  "zip_code": "90210"
}
```

**Response:**
```json
{
  "success": true,
  "client_id": "27918675",
  "action": "created",
  "message": "Client created successfully"
}
```

**Use Case:** Create new customer records or update existing ones

---

#### 5. Delete Client
**Endpoint:** `delete-client`
**Method:** POST

**Request:**
```json
{
  "client_id": "27918675"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

**Use Case:** Remove test clients (development/testing only)

---

## Multi-Location Configuration

Each franchise location requires configuration in `LOCATION_CONFIGS`:

```javascript
const LOCATION_CONFIGS = {
  'paintez_north_tampa': {
    businessId: '406031',
    apiPrivateKey: '03c87c55bb7f43b0ad77e5bed7f732da',
    staffId: 513927,
    locationId: 635883,
    reasonId: 735070
  },
  'current_location': {
    businessId: '403923',
    apiPrivateKey: '03c87c55bb7f43b0ad77e5bed7f732da',
    staffId: 512602,
    locationId: 634895,
    reasonId: 733663
  }
};
```

**All TimeTap functions require `location_id` parameter**

---

## Bland AI Setup

### Required Pathway Flow

```
1. Greeting & Info Collection
   ↓
2. Ask for Date → Extract: {{requested_appointment_date}}
   ↓
3. Webhook: Check Availability
   POST /check-availability
   Body: { "location_id": "paintez_north_tampa", "requested_appointment_date": "{{date}}" }
   ✅ Enable "Wait for Response"
   Extract: {{available_times}}
   ↓
4. Read Times → Customer Picks → Extract: {{confirmed_appointment_time}}
   ↓
5. Webhook: Book Appointment
   POST /book-appointment
   Body: { "location_id": "...", all customer data, date, time }
   ✅ Enable "Wait for Response"
   ↓
6. Confirmation Message
```

### Critical Webhook Settings

**Both webhooks MUST have:**
- **Method:** POST
- **Header:** `Content-Type: application/json`
- **✅ "Wait for Response" ENABLED** (Synchronous mode)

---

## Adding New Franchise Locations

### Step 1: Get TimeTap Credentials
From franchise's TimeTap account:
- Business ID (API Key)
- API Private Key

### Step 2: Discover IDs

**Use the setup endpoint:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/setup-location \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "407999",
    "api_private_key": "abc123xyz...",
    "location_name": "paintez_miami"
  }'
```

**Response includes:**
- All staff IDs
- All location IDs
- All reason/service IDs
- Ready-to-paste config template

### Step 3: Add to LOCATION_CONFIGS

Update both files:
- `netlify/functions/check-availability.js`
- `netlify/functions/book-appointment.js`

Add the new location config with correct IDs from Step 2.

### Step 4: Deploy & Test

```bash
git add netlify/functions/*.js
git commit -m "Add new location: paintez_miami"
git push origin main
```

Test availability:
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/check-availability \
  -H "Content-Type: application/json" \
  -d '{ "location_id": "paintez_miami", "requested_appointment_date": "2025-12-21" }'
```

### Step 5: Configure Bland AI

Create new pathway with `location_id = "paintez_miami"` hardcoded at start.

---

## ClientTether CRM Integration Details

### Authentication

All ClientTether functions use header-based authentication:

```javascript
const CLIENTTETHER_CONFIG = {
  baseUrl: 'https://api.clienttether.com',
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
  webKey: 'CT_574bf374ca11e449b9b6ffd83d71e341'
};

// Headers for all requests:
headers: {
  'X-Access-Token': CLIENTTETHER_CONFIG.accessToken,
  'X-Web-Key': CLIENTTETHER_CONFIG.webKey,
  'Content-Type': 'application/json'
}
```

### API Endpoints Used

- **Search Client:** `GET /read_client_exist?phone={phone}` or `?email={email}`
- **Create Client:** `POST /create_client`
- **Delete Client:** `DELETE /delete_client`

### Field Names (camelCase)

**Correct:**
- `firstName`, `lastName`, `phone`, `address`, `zip`

**Wrong (don't use):**
- `first_name`, `last_name`, `access_token`, `web_key`

### Automatic CRM Sync

**book-appointment.js automatically:**
1. Books appointment in TimeTap
2. Syncs customer data to ClientTether
3. Returns both appointment ID and client ID

---

## Testing Commands

**Check Availability:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/check-availability \
  -H "Content-Type: application/json" \
  -d '{"location_id": "paintez_north_tampa", "requested_appointment_date": "2025-12-21"}'
```

**Book Appointment:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_north_tampa",
    "customer_first_name": "Test",
    "customer_last_name": "User",
    "customer_phone": "555-0000",
    "property_address": "123 Test St",
    "zip_code": "12345",
    "requested_appointment_date": "2025-12-21",
    "confirmed_appointment_time": "2:00 PM",
    "project_type": "Test"
  }'
```

**Check Client:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/check-client \
  -H "Content-Type: application/json" \
  -d '{"customer_phone": "555-123-4567"}'
```

**Create Client:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/create-update-client \
  -H "Content-Type: application/json" \
  -d '{
    "customer_first_name": "Sarah",
    "customer_last_name": "Johnson",
    "customer_phone": "555-123-4567",
    "property_address": "123 Main St",
    "zip_code": "90210"
  }'
```

---

## Troubleshooting

### Error: "Missing required parameter: location_id"
**Fix:** Add `"location_id": "paintez_north_tampa"` to request body

### Error: "Unknown location_id"
**Fix:** Use one of the configured locations or add new location to LOCATION_CONFIGS

### Error: "no available times"
**Causes:**
- Date in past
- No availability in TimeTap for that date/staff
- Wrong IDs in configuration

**Fix:** Try different date or verify configuration

### Bland AI not getting response
**Fix:** Enable "Wait for Response" in Bland AI webhook settings

### ClientTether returns CT_501
**Causes:**
- Missing required field
- Invalid authentication
- Wrong endpoint format

**Fix:** Verify all fields present and authentication headers correct

---

## Configured Locations

| location_id | Business Name | Status |
|------------|--------------|--------|
| `current_location` | Original location | Production |
| `paintez_north_tampa` | North Tampa | Production |
| `sandbox` | Testing | Development |

---

## Required Variables for Bland AI

**Check Availability needs:**
- `location_id`
- `requested_appointment_date` (YYYY-MM-DD)

**Book Appointment needs:**
- `location_id`
- `customer_first_name`
- `customer_last_name`
- `customer_phone`
- `property_address`
- `zip_code`
- `requested_appointment_date` (YYYY-MM-DD)
- `confirmed_appointment_time` (12-hour format: "9:00 AM")
- `project_type`

---

## Documentation Links

- **ClientTether API Documentation:** [CLIENTTETHER_INTEGRATION.md](CLIENTTETHER_INTEGRATION.md)
- **TimeTap API:** https://www.timetap.com/api/
- **Netlify Functions:** https://docs.netlify.com/functions/overview/
- **Bland AI:** https://www.bland.ai/

---

## Support

**Issues?**
1. Check troubleshooting section
2. Test endpoints directly with curl
3. Check Netlify function logs
4. Verify TimeTap/ClientTether dashboards

**Contact team with:**
- Error message
- Request payload
- Netlify logs

---

## System Status

✅ Multi-location TimeTap scheduling
✅ Automated ClientTether CRM sync
✅ 3 TimeTap functions operational
✅ 3 ClientTether functions operational
✅ Bland AI integration configured
✅ Ready to scale to 70+ franchises

---

**Last Updated:** December 2025
**Version:** 3.0 (TimeTap + ClientTether Integration)
**Repository:** paintEZ_Netlify
