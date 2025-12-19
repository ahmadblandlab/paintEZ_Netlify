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
5. **Smart duplicate prevention** - reuses existing client records
6. Customer data synced to ClientTether CRM
7. Confirmation sent!

**For Franchises:**

- 24/7 automated booking across unlimited locations
- **Automatic duplicate prevention** - no duplicate client records
- Automatic CRM customer tracking
- No manual data entry
- Clean, organized customer database

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
    │   ├─ Search for existing client by phone
    │   ├─ Found? Reuse client ✅
    │   └─ Not found? Create new client
    │
    └─→ ClientTether API (CRM)
        ├─ Search for existing client by phone
        ├─ Found? Update existing ✅
        └─ Not found? Create new
```

---

## 🎯 Duplicate Client Prevention (NEW!)

**The system automatically prevents duplicate client records in both TimeTap and ClientTether.**

### How It Works:

**TimeTap (Scheduling):**

1. When booking an appointment, **search by phone number first**
2. If client exists → **reuse their clientId** (no duplicate created)
3. If not found → create new client and get clientId
4. Book appointment with clientId (existing or new)

**ClientTether (CRM):**

1. Search by phone number
2. If client exists → **update their information**
3. If not found → create new client record

### Benefits:

- ✅ **No duplicate client records** for repeat customers
- ✅ **Clean database** - one record per customer
- ✅ **Accurate customer history** - all appointments linked to same client
- ✅ **Better marketing data** - no inflated customer counts

### Technical Details:

- **Primary identifier:** Phone number (cleaned, digits only)
- **Search endpoint:** `GET /clients?businessId=X&cellPhone=Y`
- **Matching logic:** Exact phone number match after removing formatting
- **Fallback:** If search fails, creates new client (fail-safe)

---

## API Endpoints

**Base URL:** `https://paintez-bland.netlify.app/.netlify/functions/`

### TimeTap Integration (Appointment Scheduling)

#### 1. Validate Zipcode

**Endpoint:** `validate-zipcode`
**Method:** POST

**Request:**

```json
{
  "zipcode": "34638"
}
```

**Response (Serviceable):**

```json
{
  "success": true,
  "serviceable": true,
  "zipcode": "34638",
  "location_id": "paintez_north_tampa",
  "territory_name": "North Tampa",
  "franchise_owner": "Tom Reilly",
  "phone_number": "(813) 738-6289",
  "message": "Great! We service your area in North Tampa."
}
```

**Response (Not Serviceable):**

```json
{
  "success": true,
  "serviceable": false,
  "zipcode": "99999",
  "message": "I'm sorry, we don't currently service your zip code..."
}
```

---

#### 2. Check Availability

**Endpoint:** `check-availability`
**Method:** POST

**Request:**

```json
{
  "location_id": "paintez_north_tampa",
  "requested_appointment_date": "2025-12-21"
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

#### 3. Book Appointment (WITH DUPLICATE PREVENTION)

**Endpoint:** `book-appointment`
**Method:** POST

**Request:**

```json
{
  "location_id": "paintez_north_tampa",
  "customer_first_name": "Sarah",
  "customer_last_name": "Johnson",
  "customer_phone": "555-123-4567",
  "customer_email": "sarah@example.com",
  "property_address": "123 Main St",
  "zip_code": "90210",
  "requested_appointment_date": "2025-12-20",
  "confirmed_appointment_time": "2:00 PM",
  "project_type": "Interior painting"
}
```

**Response (New Customer):**

```json
{
  "success": true,
  "appointment_id": "192937422",
  "confirmation_number": "0g3mAIPyMQRK",
  "appointment_date": "2025-12-20",
  "appointment_time": "2:00 PM",
  "customer_name": "Sarah Johnson",
  "location_id": "paintez_north_tampa",
  "status_message": "Appointment booked successfully!"
}
```

**Response (Repeat Customer - Reused Existing Client):**

```json
{
  "success": true,
  "appointment_id": "192937423",
  "confirmation_number": "xY9kL2mABC",
  "appointment_date": "2025-12-21",
  "appointment_time": "10:00 AM",
  "customer_name": "Sarah Johnson",
  "location_id": "paintez_north_tampa",
  "status_message": "Appointment booked successfully!"
}
```

**Behind the Scenes:**

1. Searches TimeTap for existing client by phone: `555-123-4567`
2. **If found:** Logs `✅ Using existing TimeTap client: 23662078`
3. **If not found:** Creates new client, logs `✅ New TimeTap client created: 23662078`
4. Books appointment with clientId
5. Syncs to ClientTether (background, non-blocking)

**Note:** Duplicate prevention happens automatically - no additional configuration needed!

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

## Booking Flow (Step-by-Step)

### Complete Customer Journey:

```
1. Customer Calls Bland AI
   ↓
2. Bland AI Collects Information
   - Name, phone, email, address, project type
   - Preferred appointment date
   ↓
3. Check Availability
   POST /check-availability
   - Returns available times for that date
   ↓
4. Customer Picks Time
   - Bland AI reads options
   - Customer confirms: "2:00 PM"
   ↓
5. Book Appointment (WITH DUPLICATE PREVENTION)
   POST /book-appointment

   Step 5a: Search TimeTap by Phone
   ├─ Found existing client?
   │  └─ YES → Use clientId: 23662078 ✅
   │         (No duplicate created!)
   └─ Not found?
      └─ Create new client → clientId: 23662078

   Step 5b: Book Appointment
   - Links appointment to clientId
   - Customer gets confirmation SMS

   Step 5c: Sync to ClientTether (Background)
   ├─ Search ClientTether by phone
   ├─ Found? → Update existing record
   └─ Not found? → Create new record
   ↓
6. Confirmation
   - Bland AI confirms appointment details
   - Customer receives SMS with confirmation link
```

---

## Multi-Location Configuration

Each franchise location requires configuration in `LOCATION_CONFIGS`:

```javascript
const LOCATION_CONFIGS = {
  paintez_north_tampa: {
    businessId: "406031",
    apiPrivateKey: "03c87c55bb7f43b0ad77e5bed7f732da",
    staffId: 513927,
    locationId: 635883,
    reasonId: 735070,
  },
  current_location: {
    businessId: "403923",
    apiPrivateKey: "03c87c55bb7f43b0ad77e5bed7f732da",
    staffId: 512602,
    locationId: 634895,
    reasonId: 733663,
  },
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
  baseUrl: 'https://api.clienttether.com/v2/api',
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
  webKey: 'CT_574bf374ca11e449b9b6ffd83d71e341',
  apiUrl: 'https://api.clienttether.com/v2/api/create_client'
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
- **Update Client:** `POST /update_client_by_id` (for existing clients)
- **Delete Client:** `DELETE /delete_client`

### Field Names (camelCase)

**Correct:**

- `firstName`, `lastName`, `phone`, `address`, `zip`

**Wrong (don't use):**

- `first_name`, `last_name`, `access_token`, `web_key`

### Automatic CRM Sync with Duplicate Prevention

**book-appointment.js automatically:**

1. Books appointment in TimeTap (with duplicate prevention)
2. Searches ClientTether for existing client by phone
3. If found → Updates existing client record
4. If not found → Creates new client record
5. Runs in background (non-blocking)
6. Booking succeeds even if CRM sync fails

---

## Testing Commands

**Check Availability:**

```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/check-availability \
  -H "Content-Type: application/json" \
  -d '{"location_id": "paintez_north_tampa", "requested_appointment_date": "2025-12-21"}'
```

**Book Appointment (New Customer):**

```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_north_tampa",
    "customer_first_name": "John",
    "customer_last_name": "NewCustomer",
    "customer_phone": "727-555-9999",
    "customer_email": "john@example.com",
    "property_address": "456 Oak Ave",
    "zip_code": "12345",
    "requested_appointment_date": "2025-12-21",
    "confirmed_appointment_time": "10:00 AM",
    "project_type": "Exterior Painting"
  }'
```

**Book Appointment (Repeat Customer - Should Reuse Client):**

```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_north_tampa",
    "customer_first_name": "John",
    "customer_last_name": "NewCustomer",
    "customer_phone": "727-555-9999",
    "customer_email": "john@example.com",
    "property_address": "456 Oak Ave",
    "zip_code": "12345",
    "requested_appointment_date": "2025-12-22",
    "confirmed_appointment_time": "2:00 PM",
    "project_type": "Touch-up"
  }'
```

**Expected:** Second booking reuses existing clientId (check Netlify logs for "✅ Using existing TimeTap client")

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

### Duplicate clients still being created

**Check Netlify logs for:**

```
Searching for existing TimeTap client by phone: XXXXX
TimeTap search returned X client(s) for phone XXXXX:
  [0] clientId: XXXXX, cellPhone: "XXXXX", fullName: "..."
  Comparing: "XXXXX" === "XXXXX" ? true/false
```

**If search returns 0 clients but client exists:**

- Verify phone format in TimeTap (must have digits)
- Check businessId is correct for that location

**If comparison returns false:**

- Phone formats don't match (one has formatting, other doesn't)
- This is now handled automatically (both cleaned before comparison)

### Client creation fails with NullPointerException

**Fix:** Verify `businessId` is included in client payload (now automatically added)

---

## Debugging Tips

### View Netlify Function Logs:

1. Go to: https://app.netlify.com/sites/paintez-bland/logs
2. Look for your function execution
3. Check for client search logs

### Key Log Messages to Look For:

**Duplicate Prevention Working:**

```
✅ Existing TimeTap client found: 23662078 with matching phone 8135551234
✅ Using existing TimeTap client: 23662078
```

**New Client Created:**

```
No existing TimeTap client found
Creating new client in TimeTap: {...}
✅ New TimeTap client created: 23668381
```

**ClientTether Sync:**

```
✅ Existing ClientTether client found: 27918675
✅ ClientTether client updated successfully
```

---

## Configured Locations

| location_id           | Business Name     | Status        |
| --------------------- | ----------------- | ------------- |
| `current_location`    | Original location | Production    |
| `paintez_north_tampa` | North Tampa       | Production ✅ |
| `sandbox`             | Testing           | Development   |

---

## Required Variables for Bland AI

**Check Availability needs:**

- `location_id`
- `requested_appointment_date` (YYYY-MM-DD)

**Book Appointment needs:**

- `location_id`
- `customer_first_name`
- `customer_last_name`
- `customer_phone` (used for duplicate prevention)
- `customer_email`
- `property_address`
- `zip_code`
- `requested_appointment_date` (YYYY-MM-DD)
- `confirmed_appointment_time` (12-hour format: "9:00 AM")
- `project_type`

---

## Recent Updates (December 2025)

### ✅ Duplicate Client Prevention (v4.0)

- **Added:** Automatic client search before creation in TimeTap
- **Added:** Phone-based duplicate detection
- **Added:** ClientTether duplicate checking and update
- **Fixed:** Client creation failures (removed problematic fields array)
- **Fixed:** Added missing businessId to client payloads
- **Improved:** Detailed logging for debugging
- **Result:** Clean customer database, no duplicate records

### ✅ TimeTap Client Management (v3.5)

- **Fixed:** 2-step client creation process (create client, then book appointment)
- **Fixed:** TimeTap API typo handling (`appointementIdHash`)
- **Fixed:** Field name corrections (`address1` per API spec)

### ✅ ClientTether Integration (v3.0)

- **Added:** CRM sync with duplicate prevention
- **Added:** Update existing clients instead of creating duplicates
- **Added:** Non-blocking background sync

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
3. Check Netlify function logs for duplicate prevention messages
4. Verify TimeTap/ClientTether dashboards

**Contact team with:**

- Error message
- Request payload
- Netlify logs (especially client search logs)

---

## System Status

✅ Multi-location TimeTap scheduling
✅ **Duplicate client prevention (TimeTap)** 🆕
✅ **Duplicate client prevention (ClientTether)** 🆕
✅ Automated ClientTether CRM sync
✅ Phone-based client matching
✅ 3 TimeTap functions operational
✅ 3 ClientTether functions operational
✅ Bland AI integration configured
✅ Clean customer database (no duplicates)
✅ Ready to scale to 70+ franchises

---

**Last Updated:** December 11, 2025
**Version:** 4.0 (Duplicate Prevention + TimeTap + ClientTether)
**Repository:** paintEZ_Netlify
**Production URL:** https://paintez-bland.netlify.app
