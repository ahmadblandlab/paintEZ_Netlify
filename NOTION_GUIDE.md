# PaintEZ Automated Booking System Guide

## What This System Does

**Automated phone appointment booking with CRM tracking**

When a customer calls → Bland AI answers → Checks TimeTap availability → Books appointment → Syncs to ClientTether CRM → Done!

---

## System Overview

```
Customer Call
    ↓
Bland AI (handles conversation)
    ↓
Netlify Functions (our API)
    ↓
    ├─→ TimeTap (appointment scheduling)
    └─→ ClientTether (customer CRM tracking)
```

**Result:** Appointments booked automatically + customer data saved for follow-ups

---

## Live System URLs

**Base URL:** `https://paintez-bland.netlify.app/.netlify/functions/`

### Working Endpoints

**TimeTap Functions:**
1. `check-availability` - Get available appointment times
2. `book-appointment` - Book appointment (auto-syncs to ClientTether)
3. `setup-location` - Add new franchise locations

**ClientTether Functions:**
1. `check-client` - Search for existing customers
2. `create-update-client` - Create/update customer records
3. `delete-client` - Remove test clients

---

## How TimeTap Works

**Purpose:** Appointment scheduling for each franchise location

**What it does:**
- Stores each franchise's calendar
- Shows available appointment times
- Books appointments with customer details
- Sends confirmation texts

**Flow:**
1. Bland AI asks customer for preferred date
2. Calls `check-availability` with date
3. Gets back available times (e.g., "9:00 AM, 2:00 PM, 4:00 PM")
4. Customer picks time
5. Calls `book-appointment` with all details
6. Appointment created in TimeTap

---

## How ClientTether Works

**Purpose:** CRM for tracking customers across all franchises

**What it does:**
- Stores customer contact info
- Tracks customer history
- Enables follow-up campaigns
- Prevents duplicate records

**Flow:**
- When booking appointment, system automatically checks if customer exists
- If new → Creates customer record
- If exists → Updates their info
- Returns customer ID for tracking

**Auto-Sync:** `book-appointment` handles this automatically - no extra Bland AI setup needed!

---

## Bland AI Setup

### Required Configuration

**1. Set Location (at start of pathway):**
```javascript
location_id = "paintez_north_tampa"
```

**2. Collect Customer Info:**
- First name
- Last name
- Phone number
- Property address
- Zip code
- Project type
- Preferred date

**3. First Webhook - Check Availability:**

**URL:** `https://paintez-bland.netlify.app/.netlify/functions/check-availability`

**Method:** POST

**Body:**
```json
{
  "location_id": "paintez_north_tampa",
  "requested_appointment_date": "{{requested_appointment_date}}"
}
```

**✅ MUST enable:** "Wait for Response"

**Extract from response:** `{{available_times}}`

**4. Read Times to Customer:**
"I have {{available_times}} available. Which works for you?"

Extract customer's choice as `{{confirmed_appointment_time}}`

**5. Second Webhook - Book Appointment:**

**URL:** `https://paintez-bland.netlify.app/.netlify/functions/book-appointment`

**Method:** POST

**Body:**
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

**✅ MUST enable:** "Wait for Response"

**6. Confirmation:**
"You're all set for {{requested_appointment_date}} at {{confirmed_appointment_time}}!"

---

## Key Settings for Bland AI

**Critical Requirements:**
1. Both webhooks MUST have "Wait for Response" enabled
2. Use POST method for both
3. Add header: `Content-Type: application/json`
4. Extract variables correctly from responses

**Common Mistake:** Forgetting "Wait for Response" - this causes timeouts!

---

## Multi-Location Support

**Each franchise needs a `location_id`:**
- `paintez_north_tampa` - North Tampa location
- `current_location` - Original location
- `sandbox` - Testing

**To add new location:**
1. Get TimeTap credentials from franchise
2. Use `setup-location` endpoint to discover IDs
3. Add config to code
4. Create new Bland AI pathway with new `location_id`

---

## Testing the System

**Test Availability:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/check-availability \
  -H "Content-Type: application/json" \
  -d '{"location_id": "paintez_north_tampa", "requested_appointment_date": "2025-12-21"}'
```

**Test Booking:**
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

**Test Client Search:**
```bash
curl -X POST https://paintez-bland.netlify.app/.netlify/functions/check-client \
  -H "Content-Type: application/json" \
  -d '{"customer_phone": "555-123-4567"}'
```

---

## What Happens When Customer Calls

**Step-by-Step:**

1. **Customer calls** → Bland AI answers
2. **Collect info** → Name, phone, address, project type
3. **Ask for date** → Customer says "December 20th"
4. **Check availability** → System calls TimeTap
5. **Read times** → "I have 9am, 2pm, and 4pm available"
6. **Customer picks** → "2pm works"
7. **Book appointment** → System books in TimeTap
8. **Sync to CRM** → System saves to ClientTether
9. **Confirm** → "You're all set for December 20th at 2pm!"
10. **Done** → Customer gets text confirmation

**Behind the scenes:**
- TimeTap has the appointment scheduled
- ClientTether has customer record for follow-ups
- Everything automated - no manual work needed

---

## Quick Reference

**System Status:**
✅ TimeTap scheduling - Working
✅ ClientTether CRM - Working
✅ Multi-location support - Working
✅ Bland AI integration - Working

**Current Locations:**
- North Tampa (paintez_north_tampa)
- Original location (current_location)
- Testing (sandbox)

**Response Times:**
- Check availability: ~1-2 seconds
- Book appointment: ~2-3 seconds

---

## Documentation Links

- **Full Technical README:** [README.md](https://github.com/ahmadblandlab/paintEZ_Netlify/blob/main/README.md)
- **ClientTether API Details:** [CLIENTTETHER_INTEGRATION.md](https://github.com/ahmadblandlab/paintEZ_Netlify/blob/main/CLIENTTETHER_INTEGRATION.md)
- **TimeTap API:** https://www.timetap.com/api/
- **Bland AI:** https://www.bland.ai/

---

## Need Help?

**Common Issues:**
- "No available times" → Check date isn't in the past
- "Bland AI timeout" → Enable "Wait for Response" in webhooks
- "Unknown location_id" → Verify location_id matches configured locations

**For Support:**
Contact dev team with error message + request details

---

**Last Updated:** December 2025
**System Version:** 3.0 (TimeTap + ClientTether)
