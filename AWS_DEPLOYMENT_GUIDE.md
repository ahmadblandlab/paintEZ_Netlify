# AWS Lambda Deployment Guide - PaintEZ Appointment System

## 🎯 What You're Deploying

7 serverless functions that handle:

- TimeTap appointment scheduling
- ClientTether CRM integration
- Multi-location franchise support

## 📦 Prerequisites

### 1. AWS Account

- You need an AWS account (free tier works fine)
- Sign up at: https://aws.amazon.com/free/

### 2. AWS CLI Installed & Configured

Check if installed:

```bash
aws --version
```

If not installed, install it:
**Mac:**

```bash
brew install awscli
```

**Linux:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download: https://awscli.amazonaws.com/AWSCLIV2.msi

### 3. Configure AWS Credentials

```bash
aws configure
```

You'll be asked for:

- **AWS Access Key ID:** Get from AWS Console → IAM → Users → Security credentials
- **AWS Secret Access Key:** Same place
- **Default region:** `us-east-1` (recommended)
- **Default output format:** `json`

### 4. Install AWS SAM CLI

**Mac:**

```bash
brew tap aws/tap
brew install aws-sam-cli
```

**Linux:**

```bash
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

**Windows:**
Download: https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi

Verify installation:

```bash
sam --version
```

---

## 🚀 Deployment Steps

### Step 1: Navigate to Project Directory

```bash
cd /Users/ahruf/paintEZ_Netlify-main
```

### Step 2: Build the Application

This packages your code for deployment:

```bash
sam build
```

**What this does:**

- Reads `template.yaml`
- Packages each function's code
- Creates a `.aws-sam` directory with deployment artifacts

**Expected output:**

```
Building codeuri: netlify/functions/ runtime: nodejs20.x ...
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```

### Step 3: Deploy to AWS

```bash
sam deploy --guided
```

**You'll be asked questions (first time only):**

| Question                        | Answer                       | Explanation                          |
| ------------------------------- | ---------------------------- | ------------------------------------ |
| Stack Name                      | `paintez-appointment-system` | Name for your CloudFormation stack   |
| AWS Region                      | `us-east-1`                  | Where to deploy (East Coast)         |
| Confirm changes                 | `Y`                          | Review changes before deploying      |
| Allow SAM CLI IAM role creation | `Y`                          | Let SAM create necessary permissions |
| Disable rollback                | `N`                          | Auto-rollback on failure             |
| Save arguments to config        | `Y`                          | Save answers for next time           |

**Deployment takes 5-10 minutes.** You'll see:

```
CloudFormation stack changeset
---------------------------------------------------------
Operation                  LogicalResourceId          ResourceType
---------------------------------------------------------
+ Add                      CheckAvailabilityFunction  AWS::Lambda::Function
+ Add                      BookAppointmentFunction    AWS::Lambda::Function
...
```

### Step 4: Get Your URLs

After deployment completes, you'll see:

```
Outputs
---------------------------------------------------------
Key                        Value
---------------------------------------------------------
ApiUrl                     https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod/
CheckAvailabilityUrl       https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod/check-availability
BookAppointmentUrl         https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod/book-appointment
...
```

**Copy these URLs!** You'll use them in Bland AI.

---

## 🧪 Testing Your Deployment

### Test 1: Check Availability

```bash
curl -X POST https://YOUR-API-URL/Prod/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "paintez_north_tampa",
    "requested_appointment_date": "2025-12-21"
  }'
```

**Expected response:**

```json
{
  "available_times": "9:00 AM, 2:00 PM, 4:00 PM",
  "success": true,
  "location_id": "paintez_north_tampa"
}
```

### Test 2: Check Client

```bash
curl -X POST https://YOUR-API-URL/Prod/check-client \
  -H "Content-Type: application/json" \
  -d '{
    "customer_phone": "555-123-4567"
  }'
```

---

## 🔄 Updating Your Functions

When you make code changes:

```bash
# 1. Edit your code in netlify/functions/
# 2. Build
sam build

# 3. Deploy (no --guided needed after first time)
sam deploy
```

SAM automatically detects changes and updates only what changed.

---

## 📊 Monitoring & Logs

### View Logs in Real-Time

```bash
sam logs -n paintez-check-availability --tail
```

### View Logs in AWS Console

1. Go to AWS Console → CloudWatch → Log Groups
2. Find `/aws/lambda/paintez-check-availability`
3. View execution logs

---

## 💰 Cost Breakdown

### AWS Free Tier (First 12 Months)

- **Lambda:** 1 million requests/month FREE
- **API Gateway:** 1 million requests/month FREE
- **CloudWatch Logs:** 5 GB storage FREE

### After Free Tier

- **Lambda:** $0.20 per 1 million requests
- **API Gateway:** $1.00 per 1 million requests
- **Estimated monthly cost:** $0-5 for typical usage

---

## 🛠️ Troubleshooting

### Error: "AWS credentials not found"

**Solution:**

```bash
aws configure
```

Enter your AWS Access Key and Secret Key.

### Error: "Stack already exists"

**Solution:** You've already deployed. Use:

```bash
sam deploy
```

(without `--guided`)

### Error: "Unable to upload artifact"

**Solution:** SAM needs an S3 bucket. It creates one automatically, but if that fails:

```bash
aws s3 mb s3://paintez-sam-deployments-$(date +%s)
```

### Error: "Rate exceeded"

**Solution:** AWS API rate limit. Wait 1 minute and try again.

---

## 🔐 Security Best Practices

### 1. API Keys in Code

**Current:** Your TimeTap and ClientTether keys are hardcoded in the functions.

**Better approach (for later):**

- Store keys in AWS Secrets Manager
- Reference them in `template.yaml`
- Functions fetch keys at runtime

### 2. API Gateway Authentication

**Current:** Your endpoints are public (anyone with URL can call them)

**Better approach (for later):**

- Add API key requirement
- Use AWS IAM authentication
- Restrict to Bland AI's IP addresses

---

## 📋 Next Steps

1. ✅ Deploy to AWS
2. ✅ Test all 7 endpoints
3. ✅ Update Bland AI with new URLs
4. 🔲 Set up CloudWatch alarms for errors
5. 🔲 Add CI/CD with GitHub Actions
6. 🔲 Move API keys to Secrets Manager
7. 🔲 Add API Gateway authentication

---

## 🆘 Need Help?

**Check deployment status:**

```bash
aws cloudformation describe-stacks --stack-name paintez-appointment-system
```

**Delete everything (start over):**

```bash
sam delete
```

**View all Lambda functions:**

```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `paintez`)].FunctionName'
```

---

## 📚 Additional Resources

- **AWS SAM Documentation:** https://docs.aws.amazon.com/serverless-application-model/
- **Lambda Best Practices:** https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- **API Gateway Documentation:** https://docs.aws.amazon.com/apigateway/
