// netlify/functions/validate-zipcode.js
// ========================================
// ZIP CODE VALIDATION & ROUTING FOR BLAND AI
// Automatically routes calls to correct franchise based on zip code
// ========================================

// ========================================
// ZIP CODE TO LOCATION MAPPING
// ========================================
// ========================================
// ZIP CODE TO LOCATION MAPPING
// ========================================
const ZIP_TO_LOCATION = {
  // North Tampa (45 zip codes) - PRODUCTION
  // Owner: Tom Reilly, Phone: (813) 738-6289
  '34638': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33544': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34637': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34639': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34614': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34609': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34604': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33576': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33525': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34607': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34654': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34461': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34602': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34669': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34613': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34610': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34608': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34446': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34606': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34601': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33523': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34667': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34448': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34668': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33626': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33556': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33548': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34688': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34681': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33558': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34685': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34683': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34677': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34695': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34655': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33559': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33549': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33635': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33761': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '33615': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34684': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34689': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34691': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34653': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34690': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },
  '34652': { location_id: 'paintez_north_tampa', territory_name: 'North Tampa', franchise_owner: 'Tom Reilly', franchise_phone_number: '(813) 738-6289' },

  // Carmel & Indianapolis (44 zip codes) - PRODUCTION
  // Owner: Ken Schoonover, Phone: (317) 495-8980
  '46032': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46033': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46037': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46038': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46236': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46240': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46250': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46256': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46260': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46268': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46280': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46290': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46107': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46117': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46130': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46140': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46142': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46143': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46154': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46161': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46163': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46186': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46201': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46202': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46203': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46204': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46205': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46206': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46216': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46218': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46219': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46220': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46225': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46226': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46227': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46229': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46235': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46237': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46239': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46249': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46259': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '47247': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46110': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },
  '46126': { location_id: 'carmel_and_indianapolis', territory_name: 'Carmel & Indianapolis', franchise_owner: 'Ken Schoonover', franchise_phone_number: '(317) 495-8980', franchise_owner_email: 'kschoonover@paintez.com' },

  // Mountainside (26 zip codes) - PRODUCTION
  // Owner: Ricardo Luna, Phone: (908) 671-3031
  '07081': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07016': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07023': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07027': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07033': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07036': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07065': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07066': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07076': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07083': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07088': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07090': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07092': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07201': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07203': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07204': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07205': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07208': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07901': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07922': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07928': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07935': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07940': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07974': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07202': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },
  '07206': { location_id: 'mountainside', territory_name: 'Mountainside', franchise_owner: 'Ricardo Luna', franchise_phone_number: '(908) 671-3031', franchise_owner_email: 'rluna@paintez.com' },


  // Current Location (Test) - Random zip codes for testing
  '90210': { location_id: 'current_location', territory_name: 'Current Location Test', franchise_owner: 'Test Owner', franchise_phone_number: '(555) 123-4567' },
  '90211': { location_id: 'current_location', territory_name: 'Current Location Test', franchise_owner: 'Test Owner', franchise_phone_number: '(555) 123-4567' },
  '90212': { location_id: 'current_location', territory_name: 'Current Location Test', franchise_owner: 'Test Owner', franchise_phone_number: '(555) 123-4567' },


  // Sandbox (Test) - Random zip codes for testing
  '10001': { location_id: 'sandbox', territory_name: 'Sandbox Test', franchise_owner: 'Sandbox Owner', franchise_phone_number: '(555) 999-8888' },
  '10002': { location_id: 'sandbox', territory_name: 'Sandbox Test', franchise_owner: 'Sandbox Owner', franchise_phone_number: '(555) 999-8888' },
  '10003': { location_id: 'sandbox', territory_name: 'Sandbox Test', franchise_owner: 'Sandbox Owner', franchise_phone_number: '(555) 999-8888' }

};

// ========================================
// REJECTION MESSAGE
// ========================================
const REJECTION_MESSAGE = "I'm sorry, we don't currently service your zip code. Our service areas are limited to specific territories. Please contact our office for expansion information.";

// ========================================
// NETLIFY FUNCTION HANDLER
// ========================================
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let zipcode;

    // Support both GET and POST
    if (event.httpMethod === 'GET') {
      // Check query parameters first: ?zipcode=12345
      zipcode = event.queryStringParameters?.zipcode;

      // If not in query, check path parameter: /validate-zipcode/12345
      if (!zipcode && event.path) {
        const pathParts = event.path.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'validate-zipcode' && /^\d{5}$/.test(lastPart)) {
          zipcode = lastPart;
        }
      }
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      zipcode = body.zipcode || body.zip_code;
    }

    // Validate zipcode provided
    if (!zipcode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing zipcode parameter',
          hint: 'Provide zipcode via POST body {"zipcode": "12345"} or GET query ?zipcode=12345',
          examples: {
            post: 'POST /validate-zipcode with body: {"zipcode": "33602"}',
            get_query: 'GET /validate-zipcode?zipcode=33602',
            get_path: 'GET /validate-zipcode/33602'
          }
        })
      };
    }

    // Clean zipcode (remove spaces, dashes)
    const cleanZip = zipcode.toString().replace(/[^0-9]/g, '').substring(0, 5);

    if (cleanZip.length !== 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid zipcode format',
          hint: 'Zipcode must be 5 digits',
          provided: zipcode
        })
      };
    }

    console.log(`Validating zipcode: ${cleanZip}`);

    // Lookup zipcode
    const locationData = ZIP_TO_LOCATION[cleanZip];

    if (locationData) {
      // ✅ SERVICEABLE - Return location to route to
      console.log(`✅ Serviceable: ${cleanZip} → ${locationData.location_id}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          serviceable: true,
          zipcode: cleanZip,
          location_id: locationData.location_id,
          territory_name: locationData.territory_name,
          franchise_owner: locationData.franchise_owner,
          franchise_phone_number: locationData.franchise_phone_number,
          franchise_owner_email: locationData.franchise_owner_email || null,
          message: `Great! We service your area in ${locationData.territory_name}.`

        })
      };
    } else {
      // ❌ NOT SERVICEABLE - Return rejection message
      console.log(`❌ Not serviceable: ${cleanZip}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          serviceable: false,
          zipcode: cleanZip,
          message: REJECTION_MESSAGE
        })
      };
    }

  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
