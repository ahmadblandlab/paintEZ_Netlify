# AWS Lambda Deployment Guide - PaintEZ Appointment System

## 🚀 Quick Start (Automated Deployment)

### Prerequisites

1. **AWS Account** - You already have this ✅
2. **AWS CLI Configured** - Run: `aws configure` ✅
3. **AWS SAM CLI** - Install it first (instructions below)

---

## 📦 Step 1: Install AWS SAM CLI

### On Mac:
```bash
brew tap aws/tap
brew install aws-sam-cli
```

### On Linux:
```bash
# Download SAM CLI
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip

# Unzip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation

# Install
sudo ./sam-installation/install

# Verify
sam --version
```

### On Windows:
Download and run: https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi

---

## 🚀 Step 2: Deploy to AWS (One Command!)

```bash
cd /home/user/paintEZ_Netlify

# Build the application
sam build

# Deploy (will ask you questions first time)
sam deploy --guided
```

### During `sam deploy --guided`, answer:

```
Stack Name [paintez-appointment-system]: <press Enter>
AWS Region [us-east-1]: <press Enter> (or choose your region)
Confirm changes before deploy [Y/n]: Y
Allow SAM CLI IAM role creation [Y/n]: Y
Disable rollback [y/N]: N
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: <press Enter>
SAM configuration environment [default]: <press Enter>
```

**That's it!** SAM will:
1. ✅ Create all 7 Lambda functions
2. ✅ Create API Gateway with HTTP endpoints
3. ✅ Set up CORS
4. ✅ Configure permissions
5. ✅ Give you all the URLs

---

## 📋 Step 3: Get Your API URLs

After deployment completes, you'll see:

```
Outputs
---------------------------------------------------------
ApiUrl                  = https://abc123.execute-api.us-east-1.amazonaws.com/prod
CheckAvailabilityUrl    = https://abc123.execute-api.us-east-1.amazonaws.com/prod/check-availability
BookAppointmentUrl      = https://abc123.execute-api.us-east-1.amazonaws.com/prod/book-appointment
CheckClientUrl          = https://abc123.execute-api.us-east-1.amazonaws.com/prod/check-client
... (all 7 URLs)
```

**Copy these URLs** - use them in Bland AI!

---

## 🧪 Step 4: Test Your Endpoints

Test availability check:
```bash
curl -X POST https://YOUR-API-URL/prod/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_north_tampa",
    "requested_appointment_date": "2025-12-21"
  }'
```

Test booking:
```bash
curl -X POST https://YOUR-API-URL/prod/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_north_tampa",
    "customer_first_name": "Test",
    "customer_last_name": "User",
    "customer_phone": "555-0000",
    "customer_email": "test@example.com",
    "property_address": "123 Test St",
    "zip_code": "12345",
    "requested_appointment_date": "2025-12-21",
    "confirmed_appointment_time": "2:00 PM",
    "project_type": "Test"
  }'
```

---

## 🔄 Updating Your Functions

Made changes to your code? Redeploy easily:

```bash
sam build
sam deploy
```

No questions asked this time - it remembers your settings!

---

## 💰 Cost Estimate

**AWS Lambda Free Tier:**
- 1 million requests/month FREE
- 400,000 GB-seconds compute FREE

**Your estimated cost:** $0-2/month (unless you get huge traffic)

**Compare to Netlify:**
- Netlify: 125k requests/month free
- AWS Lambda: 1M requests/month free (8x more!)

---

## 🎯 Integration with Bland AI

Replace your Netlify URLs with AWS URLs:

**Old (Netlify):**
```
https://paintez-bland.netlify.app/.netlify/functions/check-availability
```

**New (AWS):**
```
https://abc123.execute-api.us-east-1.amazonaws.com/prod/check-availability
```

Everything else stays the same! Same request format, same response format.

---

## 📊 Monitoring Your Functions

### View Logs:
```bash
sam logs -n paintez-check-availability --tail
```

### View in AWS Console:
1. Go to **CloudWatch** → **Log groups**
2. Find `/aws/lambda/paintez-check-availability`
3. View real-time logs

---

## 🔧 Troubleshooting

### Error: "SAM CLI not found"
Install SAM CLI first (see Step 1 above)

### Error: "No AWS credentials found"
Run: `aws configure` and enter your access keys

### Error: "Stack already exists"
If you need to delete and start over:
```bash
sam delete
```

### Functions work but getting timeout errors?
Increase timeout in `template.yaml`:
```yaml
Globals:
  Function:
    Timeout: 60  # Change from 30 to 60 seconds
```

Then redeploy: `sam build && sam deploy`

---

## ✅ What Got Deployed

| Resource | What It Is | Count |
|----------|-----------|-------|
| Lambda Functions | Your serverless code | 7 |
| API Gateway | HTTP API endpoints | 1 |
| IAM Roles | Permissions for Lambda | 1 per function |
| CloudWatch Log Groups | Function logs | 7 |
| S3 Bucket | Deployment artifacts | 1 |

---

## 🎉 Success Checklist

- ✅ SAM CLI installed
- ✅ `sam build` completed successfully
- ✅ `sam deploy --guided` completed
- ✅ Got all 7 API URLs
- ✅ Tested at least one endpoint with curl
- ✅ Updated Bland AI with new URLs

---

## 🆘 Need Help?

**View stack in AWS Console:**
1. Go to **CloudFormation**
2. Find stack: `paintez-appointment-system`
3. View all resources created

**Delete everything (if starting over):**
```bash
sam delete --stack-name paintez-appointment-system
```

**Contact me if stuck!**
