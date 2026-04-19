# 🚨 405 Error Fix: S3 Static Hosting Won't Work

## The Problem
You're getting "GenAI query failed: Request failed with status 405" because you deployed your Node.js application to **S3 static website hosting**.

**S3 static hosting can ONLY serve static files** (HTML, CSS, JS). It **cannot run server-side code** or handle API requests.

## The Solution: Deploy to a Server Platform

Your application needs to run on a platform that can execute Node.js/Express server code.

### ✅ Quick Fix: AWS App Runner (Recommended)

1. **Go to AWS App Runner Console**
   - Search for "App Runner" in AWS Console

2. **Create New Service**
   - Service name: `college-match-app`
   - Source: Choose your GitHub repository

3. **Configure Build**
   - Build command: `npm install`
   - Start command: `node server.js`
   - Port: `3000`

4. **Environment Variables** (Critical!)
   ```
   GOOGLE_API_KEY=your-actual-api-key-here
   MODEL_ID=gemini-flash-lite-latest
   S3_BUCKET=freecaps
   AWS_REGION=us-east-1
   ```

5. **IAM Role** (for S3 access)
   - Create role with `s3:PutObject` permission on `arn:aws:s3:::freecaps/*`
   - Attach to App Runner service

6. **Deploy**
   - App Runner will build and deploy automatically
   - Get your app URL from the service dashboard

### 🧪 Test Your Fix

```bash
# Replace with your actual App Runner URL
APP_URL=https://your-app-id.region.awsapprunner.com

# Test basic page load
curl $APP_URL/

# Test the API endpoint (should work now!)
curl -X POST $APP_URL/api/google-genai-query \
  -H "Content-Type: application/json" \
  -d '{"formData":"Test applicant: SAT 1400, GPA 3.8, California"}'
```

### 📊 Expected Results
- ✅ API returns JSON with `candidateText` and `candidateHtml`
- ❌ No more 405 "Method Not Allowed" errors
- ✅ Files upload to S3 bucket automatically

### 💰 Cost
- **App Runner**: ~$5-20/month (pay per usage)
- **S3**: ~$0.02/month (file storage)

### 🚫 What NOT to Do
- ❌ Don't deploy to S3 static hosting
- ❌ Don't use CloudFront + S3 alone
- ❌ Don't expect static hosting to run Node.js

### ✅ What TO Do
- ✅ Use App Runner, Lambda, ECS, or Elastic Beanstalk
- ✅ Set all environment variables correctly
- ✅ Configure IAM permissions for S3
- ✅ Test API endpoints after deployment

---

**Next Step**: Deploy to AWS App Runner and your 405 error will be fixed!