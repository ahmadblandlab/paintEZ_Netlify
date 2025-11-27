# 🎨 PaintEZ Multi-Location Appointment System

**A scalable Netlify-based appointment booking system for PaintEZ franchises using TimeTap + Bland AI**

---

## 📋 Table of Contents

1. [What This System Does](#what-this-system-does)
2. [Latest Update: Multi-Location Support](#latest-update-multi-location-support)
3. [How It Works (Non-Technical)](#how-it-works-non-technical)
4. [Technical Architecture](#technical-architecture)
5. [Bland AI Setup Guide](#bland-ai-setup-guide)
6. [Adding New Franchises](#adding-new-franchises)
7. [Migration Guide (Old → New)](#migration-guide-old--new)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 What This System Does

**For Customers:**
1. Customer calls PaintEZ franchise phone number
2. Bland AI answers and collects project details
3. System checks **real-time availability** from TimeTap
4. AI reads available times to customer
5. Customer picks a time
6. Appointment is **automatically booked** in TimeTap
7. Confirmation sent!

**For Franchises:**
- Automated 24/7 appointment booking
- No manual scheduling needed
- Works across unlimited franchise locations
- Each franchise has its own TimeTap account

---

## 🚀 Latest Update: Multi-Location Support

### **What Changed? (November 2025)**

**BEFORE:** System only worked for ONE franchise location
- Hardcoded credentials for single location
- Adding new franchises required code duplication
- Manual ID discovery for each new franchise

**AFTER:** System supports UNLIMITED franchise locations
- One codebase for all franchises
- Dynamic location selection via `location_id` parameter
- Automated ID discovery tool included
- Currently supports 70+ franchises

---

### **⚠️ BREAKING CHANGE**

**Both endpoints NOW REQUIRE a `location_id` parameter!**

**Old Request (will fail):**
```json
{
  "requested_appointment_date": "2025-11-20"
}
```

**New Request (required):**
```json
{
  "location_id": "paintez_north_tampa",
  "requested_appointment_date": "2025-11-20"
}
```

**If you're using the old code:** You MUST update your Bland AI configuration to include `location_id`.

---

### **🕐 Recent Fix: Timezone Handling (November 2025)**

**Issue Fixed:** Bookings would fail with "outside of Staff Availability" error even when selecting available times.

**Root Cause:** Timezone differences between customer display times and staff working times were not being handled. When a staff member was in Mountain Time (Denver) and a customer saw "9:00 AM" as available, that was actually an 11:00 AM slot in the staff's timezone. The system was sending 9:00 AM directly to TimeTap, which didn't match.

**Solution Implemented:**
- System now queries availability before booking
- Matches customer's chosen time to the correct staff timezone slot
- Books using the actual staff working time automatically
- **Completely automatic** - no configuration needed!

**Result:** Bookings now work correctly across all timezones without any manual timezone configuration! ✅

---

## 🧠 How It Works (Non-Technical)

### **The Date → Times → Book Flow**

Think of it like calling a restaurant for a reservation:

```
1. You tell them what DAY you want: "Thursday, November 20th"
   ↓
2. They check their calendar and say: "We have 9am, 2pm, or 4pm open"
   ↓
3. You pick: "2pm works for me"
   ↓
4. They book you in: "Great, you're all set for Thursday at 2pm!"
```

**Our system does the same thing:**

```
Customer → Bland AI → "What day works for you?"
           ↓
Customer → "Thursday"
           ↓
Bland AI → Netlify → "What times are free on Thursday?"
           ↓
Netlify → TimeTap → Checks calendar
           ↓
TimeTap → Netlify → "9am, 2pm, 4pm are open"
           ↓
Netlify → Bland AI → Returns times
           ↓
Bland AI → Customer → "I have 9am, 2pm, or 4pm. Which works?"
           ↓
Customer → "2pm"
           ↓
Bland AI → Netlify → Books appointment for Thursday at 2pm
           ↓
Netlify → TimeTap → Creates appointment
           ↓
Done! ✅
```

---

### **Why Netlify Instead of Zapier?**

**Zapier Problem:**
- Zapier receives your request → says "OK got it!" → then processes
- By the time Zapier gets the data, Bland AI has already moved on
- It's like calling someone and they hang up before answering your question

**Netlify Solution:**
- Netlify receives your request → waits → gets the data → sends it back
- Bland AI gets immediate response with the data it needs
- It's like calling someone and they stay on the line to answer you

**Technical term:** Netlify supports **synchronous request/response**, Zapier does **asynchronous processing**.

---

## 🏗️ Technical Architecture

### **System Components**

```
┌──────────────┐
│  Customer    │ ← Calls phone number
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Bland AI    │ ← Conversational AI
│  (Pathway)   │   - Collects info
└──────┬───────┘   - Extracts variables
       │           - Makes webhook calls
       ↓
┌──────────────────────────┐
│  Netlify Functions       │ ← API Layer (This repo!)
│  ┌────────────────────┐  │
│  │ check-availability │  │ ← Gets available times
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ book-appointment   │  │ ← Creates appointment
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ setup-location     │  │ ← (Internal tool)
│  └────────────────────┘  │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│  TimeTap API             │ ← Scheduling platform
│  - Authentication        │   - Each franchise has own account
│  - Availability checks   │   - Stores appointments
│  - Appointment creation  │   - Sends confirmations
└──────────────────────────┘
```

---

### **Three Netlify Functions**

#### **1. check-availability.js**

**Purpose:** Returns available appointment times for a specific date

**Input:**
```json
{
  "location_id": "paintez_north_tampa",
  "requested_appointment_date": "2025-11-20"
}
```

**Output:**
```json
{
  "available_times": "9:00 AM, 2:00 PM, 4:00 PM",
  "success": true,
  "location_id": "paintez_north_tampa"
}
```

**What it does:**
1. Looks up credentials for `location_id` in LOCATION_CONFIGS
2. Authenticates with TimeTap using that franchise's API keys
3. Queries TimeTap for available slots on the requested date
4. Formats times into readable format (9:00 AM, 2:00 PM, etc.)
5. Returns formatted times to Bland AI

---

#### **2. book-appointment.js**

**Purpose:** Creates an appointment in TimeTap

**Input:**
```json
{
  "location_id": "paintez_north_tampa",
  "customer_first_name": "Sarah",
  "customer_last_name": "Johnson",
  "customer_phone": "555-123-4567",
  "property_address": "123 Main St",
  "zip_code": "90210",
  "requested_appointment_date": "2025-11-20",
  "confirmed_appointment_time": "2:00 PM",
  "project_type": "Interior painting"
}
```

**Output:**
```json
{
  "success": true,
  "appointment_id": "190504898",
  "confirmation_number": "xY9kL2m",
  "status_message": "Appointment booked successfully!"
}
```

**What it does:**
1. Looks up credentials for `location_id`
2. Authenticates with TimeTap
3. **Queries availability to get correct timezone slot** (handles timezone automatically)
4. Matches customer's chosen time to the actual staff working time
5. Creates appointment with all customer details using correct timezone
6. Returns confirmation to Bland AI

**Note:** The timezone handling (step 3-4) ensures bookings work correctly even when staff and customers are in different timezones. The system automatically translates customer display times to staff working times.

---

#### **3. setup-location.js** (Internal Use Only)

**Purpose:** Auto-discover TimeTap IDs for new franchises

**Input:**
```json
{
  "business_id": "406031",
  "api_private_key": "03c87c55bb7f43b0ad77e5bed7f732da",
  "location_name": "paintez_miami"
}
```

**Output:**
```json
{
  "success": true,
  "discovered_ids": {
    "staff": [513927, 513925],
    "locations": [635883, 635888],
    "reasons": [735070, 735072, 735073]
  },
  "config_template": {
    "paintez_miami": {
      "businessId": "406031",
      "apiPrivateKey": "03c87c55bb7f43b0ad77e5bed7f732da",
      "staffId": 513927,
      "locationId": 635883,
      "reasonId": 735070
    }
  },
  "next_steps": [...]
}
```

**What it does:**
1. Authenticates with TimeTap using provided credentials
2. Fetches all available staff IDs
3. Fetches all available location IDs
4. Fetches all available reason/service IDs
5. Returns everything with a ready-to-paste config template

**When to use:** Only when onboarding a NEW franchise location

---

### **Multi-Location Configuration**

**Location Config Object (in both check-availability.js and book-appointment.js):**

```javascript
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
  // Add more locations here...
};
```

**How it works:**
- When `location_id: "paintez_north_tampa"` comes in, system looks up that entry
- Extracts that franchise's specific credentials
- Uses those credentials for all TimeTap API calls
- One codebase, unlimited franchises!

---

## 📞 Bland AI Setup Guide

### **🎯 Recommended Approach: Separate Phone Numbers**

**Best Practice:** Each franchise has its own Bland AI phone number with hardcoded `location_id`

---

### **Step-by-Step Bland AI Configuration**

#### **For North Tampa Franchise:**

**1. Create/Edit Bland AI Pathway**
- Go to Bland AI Dashboard
- Create pathway for North Tampa or edit existing

**2. Add Location Variable (At Start of Pathway)**
```javascript
// Add this as the very first node:
location_id = "paintez_north_tampa"
```

**3. Configure "Check Availability" Webhook Node**

**When to trigger:** After collecting the date from customer

**Webhook Settings:**
- **URL:** `https://[your-site].netlify.app/.netlify/functions/check-availability`
- **Method:** `POST`
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body:**
  ```json
  {
    "location_id": "paintez_north_tampa",
    "requested_appointment_date": "{{requested_appointment_date}}"
  }
  ```
- **✅ CRITICAL:** Enable "Wait for Response"
- **Extract response:** Save `available_times` into variable

**4. Read Times to Customer**

**Prompt:**
```
"Great! I can see we have {{available_times}} available on {{requested_appointment_date}}.
Which of those times works best for you?"
```

**Extract:** Customer's chosen time into `{{confirmed_appointment_time}}`

**5. Configure "Book Appointment" Webhook Node**

**When to trigger:** After customer confirms time

**Webhook Settings:**
- **URL:** `https://[your-site].netlify.app/.netlify/functions/book-appointment`
- **Method:** `POST`
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body:**
  ```json
  {
    "location_id": "paintez_north_tampa",
    "customer_first_name": "{{customer_first_name}}",
    "customer_last_name": "{{customer_last_name}}",
    "customer_phone": "{{customer_phone}}",
    "property_address": "{{property_address}}",
    "zip_code": "{{zip_code}}",
    "requested_appointment_date": "{{requested_appointment_date}}",
    "confirmed_appointment_time": "{{confirmed_appointment_time}}",
    "project_type": "{{project_type}}"
  }
  ```
- **✅ CRITICAL:** Enable "Wait for Response"

**6. Confirmation Message**

**Prompt:**
```
"Perfect! You're all set for {{requested_appointment_date}} at {{confirmed_appointment_time}}.
You'll receive a confirmation text shortly. Is there anything else I can help you with?"
```

---

### **Complete Bland AI Pathway Flow**

```
┌─────────────────────────────────────┐
│ 1. GREETING                         │
│    "Hi, this is PaintEZ North Tampa"│
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. COLLECT INFO                     │
│    - First name                     │
│    - Last name                      │
│    - Phone number                   │
│    - Property address               │
│    - Zip code                       │
│    - Project type                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. ASK FOR DATE                     │
│    "What day works best?"           │
│    Extract: {{requested_appointment_date}}
│    Format: YYYY-MM-DD               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. WEBHOOK: Check Availability      │
│    POST /check-availability         │
│    Send: location_id + date         │
│    ✅ Wait for response              │
│    Receive: {{available_times}}     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. READ TIMES TO CUSTOMER           │
│    "I have {{available_times}}"     │
│    "Which works for you?"           │
│    Extract: {{confirmed_appointment_time}}
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. WEBHOOK: Book Appointment        │
│    POST /book-appointment           │
│    Send: All 8 variables            │
│    ✅ Wait for response              │
│    Receive: confirmation            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 7. CONFIRMATION                     │
│    "You're all set!"                │
│    "See you at {{confirmed_appointment_time}}"
└─────────────────────────────────────┘
```

---

### **🔄 Alternative: Single Phone Number with Location Detection**

**If you want ONE phone number for all locations:**

**Option A: Ask Customer**
```javascript
// In Bland pathway:
Bland: "Which PaintEZ location are you calling about?"
Customer: "North Tampa"

// Map response to location_id:
if (response.includes("North Tampa")) {
  location_id = "paintez_north_tampa"
} else if (response.includes("Miami")) {
  location_id = "paintez_miami"
}
```

**Option B: Zip Code Mapping**
```javascript
// After collecting zip code:
function getLocationFromZip(zip) {
  if (["33602", "33603", "33604"].includes(zip)) {
    return "paintez_north_tampa";
  }
  else if (["33101", "33102"].includes(zip)) {
    return "paintez_miami";
  }
  else {
    return "current_location"; // default
  }
}

location_id = getLocationFromZip(customer_zip);
```

---

## 🆕 Adding New Franchises

### **Complete Onboarding Workflow**

**Scenario:** You just opened PaintEZ Miami and need to add it to the system

---

### **Step 1: Get TimeTap Credentials**

From the Miami franchise's TimeTap account:
- **Business ID** (API Key): e.g., `407999`
- **API Private Key**: e.g., `abc123xyz...`

---

### **Step 2: Discover IDs Using Setup Endpoint**

**Make a POST request to:**
```
https://[your-site].netlify.app/.netlify/functions/setup-location
```

**Body:**
```json
{
  "business_id": "407999",
  "api_private_key": "abc123xyz...",
  "location_name": "paintez_miami"
}
```

**Using curl:**
```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/setup-location \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "407999",
    "api_private_key": "abc123xyz...",
    "location_name": "paintez_miami"
  }'
```

---

### **Step 3: Review Discovered IDs**

**Response will look like:**
```json
{
  "success": true,
  "discovered_ids": {
    "staff": [999001, 999002, 999003],
    "locations": [888001, 888002],
    "reasons": [777001, 777002, 777003, 777004]
  },
  "config_template": {
    "paintez_miami": {
      "businessId": "407999",
      "apiPrivateKey": "abc123xyz...",
      "staffId": 999001,
      "locationId": 888001,
      "reasonId": 777001,
      "_note": "Review discovered_ids and update as needed"
    }
  }
}
```

---

### **Step 4: Choose Correct IDs**

**Log into Miami's TimeTap account** and review:

**Staff IDs:**
- 999001 = "John Smith - Lead Estimator" ← **Use this one**
- 999002 = "Jane Doe - Assistant" ← Skip
- 999003 = "Bob Johnson - Painter" ← Skip

**Location IDs:**
- 888001 = "Miami Main Office" ← **Use this one**
- 888002 = "Storage Warehouse" ← Skip

**Reason IDs:**
- 777001 = "Free Estimate" ← **Use this one**
- 777002 = "Follow-up Visit" ← Skip
- 777003 = "Emergency Repair" ← Skip
- 777004 = "Final Walkthrough" ← Skip

**Pick the ones that make sense for customer-facing appointments!**

---

### **Step 5: Update Code**

**Edit both files:**
- `netlify/functions/check-availability.js`
- `netlify/functions/book-appointment.js`

**Find the `LOCATION_CONFIGS` object and add:**
```javascript
const LOCATION_CONFIGS = {
  'current_location': { ... },
  'paintez_north_tampa': { ... },
  'sandbox': { ... },
  // ADD THIS:
  'paintez_miami': {
    businessId: '407999',
    apiPrivateKey: 'abc123xyz...',
    staffId: 999001,      // ← Your chosen staff ID
    locationId: 888001,   // ← Your chosen location ID
    reasonId: 777001      // ← Your chosen reason ID
  }
};
```

**⚠️ IMPORTANT:** Add it to **BOTH** files with **identical** configuration!

---

### **Step 6: Deploy**

```bash
git add netlify/functions/check-availability.js netlify/functions/book-appointment.js
git commit -m "Add paintez_miami location configuration"
git push origin main
```

**Netlify will auto-deploy in ~30 seconds**

---

### **Step 7: Test**

**Test availability:**
```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_miami",
    "requested_appointment_date": "2025-11-21"
  }'
```

**Expected response:**
```json
{
  "available_times": "9:00 AM, 2:00 PM, 4:00 PM",
  "success": true,
  "location_id": "paintez_miami"
}
```

**If you get an error, double-check:**
- ✅ Added config to BOTH files
- ✅ Used correct IDs from TimeTap
- ✅ API credentials are valid
- ✅ Deployed successfully

---

### **Step 8: Configure Bland AI**

**Create new pathway for Miami** or duplicate existing:
1. Set `location_id = "paintez_miami"` at start
2. Update both webhook bodies to use `"location_id": "paintez_miami"`
3. Assign Miami's phone number to this pathway
4. Test with a real call

---

### **Step 9: Done! ✅**

Miami is now live and ready to take appointments!

**Repeat for each new franchise location.**

---

## 🔄 Migration Guide (Old → New)

### **If You're Currently Using the Old Code**

**Old System:**
- Single hardcoded location
- No `location_id` parameter
- Credentials at top of file

**New System:**
- Multi-location support
- REQUIRES `location_id` parameter
- Credentials in `LOCATION_CONFIGS` object

---

### **Migration Steps:**

#### **1. Update Your Code**

Pull the latest code from the `main` branch:
```bash
git pull origin main
```

You should now have:
- ✅ `LOCATION_CONFIGS` object in both functions
- ✅ Three locations configured: current_location, paintez_north_tampa, sandbox
- ✅ New `setup-location.js` file

---

#### **2. Find Your Current Setup in Config**

Your old hardcoded credentials are now at `'current_location'`:
```javascript
'current_location': {
  businessId: '403923',      // ← Your old BUSINESS_ID
  apiPrivateKey: '03c87c55bb7f43b0ad77e5bed7f732da',
  staffId: 512602,
  locationId: 634895,
  reasonId: 733663
}
```

---

#### **3. Update Bland AI Configuration**

**OLD Bland AI Webhook Body:**
```json
{
  "requested_appointment_date": "{{requested_appointment_date}}"
}
```

**NEW Bland AI Webhook Body:**
```json
{
  "location_id": "current_location",
  "requested_appointment_date": "{{requested_appointment_date}}"
}
```

**Apply to BOTH:**
- Check availability webhook
- Book appointment webhook

---

#### **4. Test**

Make a test call to ensure it still works with `location_id: "current_location"`

---

#### **5. (Optional) Rename Your Location**

If you want a more descriptive name than `current_location`:

**In both function files, rename the key:**
```javascript
const LOCATION_CONFIGS = {
  'paintez_original_location': {  // ← Better name
    businessId: '403923',
    // ... rest stays the same
  }
};
```

**Then update Bland AI:**
```json
{
  "location_id": "paintez_original_location"
}
```

---

## 🐛 Troubleshooting

### **Common Errors and Solutions**

---

#### **Error 1: "Missing required parameter: location_id"**

```json
{
  "success": false,
  "error": "Missing required parameter: location_id"
}
```

**Cause:** You didn't include `location_id` in request body

**Fix:** Add `"location_id": "paintez_north_tampa"` to your webhook body in Bland AI

---

#### **Error 2: "Unknown location_id: paintez_xyz"**

```json
{
  "success": false,
  "error": "Unknown location_id: paintez_xyz",
  "available_locations": ["current_location", "paintez_north_tampa", "sandbox"]
}
```

**Cause:** Location ID doesn't exist in LOCATION_CONFIGS

**Fix:**
- Use one of the `available_locations` listed
- OR add the new location to LOCATION_CONFIGS (see "Adding New Franchises")

---

#### **Error 3: "available_times: no available times"**

```json
{
  "available_times": "no available times",
  "success": false
}
```

**Cause:** No availability in TimeTap for that date

**Possible reasons:**
- Date is in the past
- Date is a weekend/holiday (if blocked in TimeTap)
- Staff member has no availability that day
- Wrong staff/location/reason IDs

**Fix:**
- Try a different date
- Check TimeTap calendar directly
- Verify IDs in LOCATION_CONFIGS match TimeTap settings

---

#### **Error 4: Bland AI not getting response**

**Symptoms:**
- Bland AI times out
- Says "I couldn't check availability"

**Cause:** "Wait for Response" not enabled in Bland AI webhook

**Fix:**
1. Go to Bland AI webhook node
2. Enable "Wait for Response" toggle
3. Ensure "Synchronous" mode is on
4. Save and test again

---

#### **Error 5: "TimeTap returned non-JSON response"**

```json
{
  "success": false,
  "error": "TimeTap returned non-JSON response"
}
```

**Cause:** Invalid credentials or TimeTap API error

**Fix:**
- Verify `businessId` and `apiPrivateKey` are correct
- Check if TimeTap API is down
- Try with different location_id to isolate issue

---

#### **Error 6: Times shown but booking fails**

**Symptoms:**
- Check availability works and returns times
- Booking one of those times returns "outside of Staff Availability" error

**This issue has been fixed!** ✅

**What was happening:**
The system now automatically handles timezone differences between customer display times and staff working times. Previously, if a customer selected "9:00 AM" from available times, but the staff was in a different timezone (e.g., Mountain Time), the booking would fail because we were sending the customer's time directly instead of the staff's actual working time.

**How it works now:**
- Before booking, the system queries availability to get the full slot data
- Matches the customer's chosen time to find the corresponding staff timezone time
- Books using the correct staff timezone automatically
- **No configuration needed** - it just works!

**If you still get booking errors:**
- Ensure all 8 required parameters are sent to book-appointment
- Verify date is YYYY-MM-DD format
- Verify time exactly matches one from available_times (including AM/PM)
- The time must be currently available (check availability first)
- Check Netlify function logs for specific error details

---

### **Testing Endpoints Directly**

**Test Check Availability:**
```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "sandbox",
    "requested_appointment_date": "2025-11-21"
  }'
```

**Test Booking:**
```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "sandbox",
    "customer_first_name": "Test",
    "customer_last_name": "User",
    "customer_phone": "555-0000",
    "property_address": "123 Test St",
    "zip_code": "12345",
    "requested_appointment_date": "2025-11-21",
    "confirmed_appointment_time": "2:00 PM",
    "project_type": "Test booking"
  }'
```

**Test Setup (for new locations):**
```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/setup-location \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "403922",
    "api_private_key": "35d46d1dc0a843e8a6e712c6f84258a9",
    "location_name": "test_location"
  }'
```

---

### **Checking Netlify Logs**

1. Go to Netlify Dashboard
2. Select your site
3. Click "Functions"
4. Click on the function (e.g., `check-availability`)
5. View real-time logs

Look for:
- ✅ "Checking availability for: paintez_north_tampa"
- ✅ "TimeTap response: ..."
- ❌ Any error messages

---

## 📚 Additional Resources

### **Related Documentation**

- **Bland AI Setup Guide:** [Link to your Notion doc]
- **TimeTap API Docs:** https://www.timetap.com/api/
- **Netlify Functions:** https://docs.netlify.com/functions/overview/

---

### **Configuration Reference**

**Currently Configured Locations:**

| location_id | Business Name | Business ID | Use Case |
|------------|--------------|------------|----------|
| `current_location` | Original location | 403923 | Production |
| `paintez_north_tampa` | North Tampa | 406031 | Production |
| `sandbox` | Testing | 403922 | Development/Testing |

---

### **Required Bland AI Variables**

**For Check Availability:**
- `requested_appointment_date` (format: YYYY-MM-DD)

**For Book Appointment:**
- `customer_first_name`
- `customer_last_name`
- `customer_phone`
- `property_address`
- `zip_code`
- `requested_appointment_date` (format: YYYY-MM-DD)
- `confirmed_appointment_time` (format: "9:00 AM" or "2:00 PM")
- `project_type`

---

## 🤝 Support

**Questions? Issues?**

1. Check [Troubleshooting](#troubleshooting) section first
2. Test endpoints directly with curl commands
3. Check Netlify function logs
4. Verify TimeTap calendar directly
5. Contact development team with:
   - Error message
   - location_id used
   - Request payload
   - Netlify logs (if available)

---

## 🎉 Success!

If you've made it this far and everything is working:

✅ Your multi-location system is live
✅ Bland AI is configured correctly
✅ Appointments are booking automatically
✅ You're ready to scale to 70+ franchises

**Welcome to automated appointment scheduling!** 🚀

---

**Last Updated:** November 2025
**Version:** 2.0 (Multi-Location Support)
**Repository:** paintEZ_Netlify
