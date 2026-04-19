# AWS Deployment Configuration

This file provides ready-to-use configurations for deploying the college-match application to AWS.

## 🚨 IMPORTANT: S3 Static Hosting WON'T WORK

**You CANNOT deploy this application to S3 static website hosting!**

This application requires server-side code execution (Node.js/Express) for:
- `/api/google-genai-query` endpoint (POST requests)
- `/api/save-preview-page` endpoint (POST requests)
- Google GenAI API integration
- S3 file uploads

**S3 static hosting only serves static files (HTML, CSS, JS) and cannot run server-side code.**

## ✅ CORRECT Deployment Options

### Option 1: AWS App Runner (Recommended - Easiest)

**Why App Runner?**
- Can run Node.js server-side code
- Handles POST requests to `/api/*` endpoints
- Auto-scaling and load balancing
- Easy deployment from GitHub or ECR
- Pay only for actual usage

**Cost**: ~$5-50/month (depending on traffic)

#### Quick Setup:

### 1. Create S3 Bucket
```bash
aws s3api create-bucket \
  --bucket freecaps \
  --region us-east-1
```

### 2. Create IAM Role for App Runner
```bash
# Create trust policy file
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name AppRunnerS3Role \
  --assume-role-policy-document file://trust-policy.json

# Create and attach permissions policy
cat > s3-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::freecaps/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name AppRunnerS3Role \
  --policy-name S3Access \
  --policy-document file://s3-policy.json
```

### 3. Deploy to App Runner

#### Via AWS Console:
1. Go to AWS App Runner
2. Create a new service
3. Select source: GitHub or ECR
4. For GitHub:
   - Connect your repository
   - Build settings: npm install
   - Start command: node server.js
5. Configure service:
   - Port: 3000
   - Environment variables:
     - GOOGLE_API_KEY: (paste your key)
     - MODEL_ID: gemini-flash-lite-latest
     - S3_BUCKET: freecaps
     - AWS_REGION: us-east-1
6. Select IAM role: AppRunnerS3Role
7. Deploy

#### Via AWS CLI:
```bash
aws apprunner create-service \
  --service-name college-match-app \
  --source-configuration \
    RepositoryType=GITHUB,\
    ImageRepository="{RepositoryUrl=your-repo,VersionIdentifier=main}" \
  --instance-configuration Cpu=0.25,Memory=512 \
  --auto-scaling-configuration-arn arn:aws:apprunner:us-east-1:ACCOUNT_ID:autoscalingconfiguration/default \
  --network-configuration \
    EgressConfiguration="{EgressType=DEFAULT}" \
  --tags Key=Environment,Value=production \
  --environment-variables \
    GOOGLE_API_KEY=your-key,\
    MODEL_ID=gemini-flash-lite-latest,\
    S3_BUCKET=freecaps,\
    AWS_REGION=us-east-1
```

## 🔧 Troubleshooting Your 405 Error

### The Problem
You're getting "405 Method Not Allowed" because you deployed to **S3 static website hosting**, which cannot execute server-side code.

### The Solution
Deploy to a platform that can run Node.js/Express:

#### Option A: AWS App Runner (Easiest)
1. Go to AWS App Runner console
2. Create new service from your GitHub repo
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Set port: `3000`
6. Add environment variables (GOOGLE_API_KEY, S3_BUCKET, etc.)
7. Attach IAM role with S3 permissions
8. Deploy

#### Option B: AWS Lambda (Cheapest)
1. Install serverless: `npm install -g serverless`
2. Create serverless.yml (see below)
3. Run `serverless deploy`

```yaml
service: college-match-app
provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    GOOGLE_API_KEY: ${env:GOOGLE_API_KEY}
    S3_BUCKET: freecaps
    AWS_REGION: us-east-1
  iamRoleStatements:
    - Effect: Allow
      Action: s3:PutObject
      Resource: "arn:aws:s3:::freecaps/*"

functions:
  app:
    handler: server.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
```

### Why S3 Static Hosting Doesn't Work
- ✅ Serves HTML, CSS, JS files
- ❌ Cannot run Node.js server code
- ❌ Cannot handle POST requests to `/api/*`
- ❌ Cannot execute Google GenAI API calls
- ❌ Cannot upload files to S3

### Testing Your Fix
After deploying to App Runner/Lambda:

```bash
# Test the API endpoint
curl -X POST https://your-app-url.com/api/google-genai-query \
  -H "Content-Type: application/json" \
  -d '{"formData":"Test data"}'

# Should return JSON with candidateText, not 405 error
```

## AWS Lambda with Layers (Serverless Framework)

### 1. Install Dependencies
```bash
npm install -g serverless
npm install --save-dev serverless-python-requirements
```

### 2. Configure serverless.yml

See `serverless.yml` in root directory.

### 3. Deploy
```bash
serverless deploy --stage prod
```

## Docker on ECS

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. Build and Push to ECR
```bash
# Create ECR repository
aws ecr create-repository --repository-name college-match-app

# Build image
docker build -t college-match-app .

# Tag image
docker tag college-match-app:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/college-match-app:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/college-match-app:latest
```

## Monitoring & Logging

### CloudWatch Logs
```bash
# View logs for App Runner
aws logs tail /aws/apprunner/college-match-app --follow

# View logs for Lambda
aws logs tail /aws/lambda/college-match-app --follow
```

### S3 Monitoring
```bash
# List uploaded files
aws s3 ls s3://freecaps/uploads/
aws s3 ls s3://freecaps/match-res-previews/

# View bucket metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=freecaps \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 86400 \
  --statistics Average
```

## Cost Optimization

1. **S3 Lifecycle Policies**: Auto-delete old previews
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket freecaps \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteOldPreviews",
        "Filter": {"Prefix": "match-res-previews/"},
        "Expiration": {"Days": 30},
        "Status": "Enabled"
      }
    ]
  }'
```

2. **S3 Intelligent-Tiering**: Auto-move to cheaper storage
```bash
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket freecaps \
  --id AutoArchive \
  --intelligent-tiering-configuration '{...}'
```

3. **App Runner Auto-Scaling**: Set appropriate limits
```bash
# Min: 1 instance, Max: 4 instances
aws apprunner update-auto-scaling-configuration \
  --auto-scaling-configuration-arn arn:aws:apprunner:... \
  --min-size 1 \
  --max-size 4
```

## Testing Production Deployment

```bash
# Get service URL
APP_URL=$(aws apprunner list-services --query 'ServiceSummaryList[0].ServiceUrl' --output text)

# Test health check
curl $APP_URL/

# Test form submission
curl -X POST $APP_URL/api/google-genai-query \
  -H "Content-Type: application/json" \
  -d '{"formData":"Test applicant data"}'

# Verify S3 content
aws s3 ls s3://freecaps/ --recursive
```

## Troubleshooting Deployment

### App Runner Health Check Fails
- Ensure server listens on 0.0.0.0:3000
- Check environment variables are set
- Review CloudWatch logs

### S3 Permission Denied
- Verify IAM role is attached to App Runner service
- Check role has s3:PutObject permission
- Confirm bucket name matches S3_BUCKET env var

### GenAI API 403/401 Error
- Verify GOOGLE_API_KEY is correct
- Check API key has quota remaining
- Confirm MODEL_ID is valid for your API key

### Memory or CPU Issues
- For App Runner: Increase instance size (0.5-2 CPU, 1-4 GB RAM)
- Monitor CloudWatch metrics
- Check for memory leaks in logs

## Rollback Procedure

### App Runner:
```bash
aws apprunner update-service \
  --service-arn <service-arn> \
  --source-configuration RepositoryUrl=<previous-commit>
```

### If Critical Issue:
```bash
# Scale down to 0
aws apprunner update-auto-scaling-configuration --min-size 0

# Or delete service
aws apprunner delete-service --service-arn <service-arn>
```

## Security Best Practices

1. **Secrets Management**: Use AWS Secrets Manager for API keys
```bash
aws secretsmanager create-secret \
  --name college-match-app/google-api-key \
  --secret-string AQ.Ab8R...
```

2. **S3 Encryption**: Enable bucket encryption
```bash
aws s3api put-bucket-encryption --bucket freecaps \
  --server-side-encryption-configuration '{...}'
```

3. **VPC**: Deploy in private VPC with NAT Gateway
4. **WAF**: Enable AWS WAF for DDoS protection
5. **Audit Logging**: Enable CloudTrail for all API calls

---

**Need Help?** See S3-DEPLOYMENT-GUIDE.md for application-specific details.
