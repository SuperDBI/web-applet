# S3 Deployment Guide

## Overview
This application is configured for deployment on AWS with full S3 file storage integration. No local filesystem writes are used.

## Architecture Changes for S3

### File Storage Strategy
- **Local Uploads**: PDFs uploaded by users are stored in S3 bucket at `uploads/{timestamp}-{filename}`
- **Preview Snapshots**: Generated preview pages are stored in S3 at `match-res-previews/preview-{ISO-timestamp}.html`
- **Result Caching**: GenAI results are cached client-side using browser localStorage/sessionStorage (no server storage needed)

### Backend Modifications
- **Multer Configuration**: Changed from disk storage to memory-based storage (`multer.memoryStorage()`)
- **S3 Client**: Integrated AWS SDK v3 (`@aws-sdk/client-s3`)
- **File Operations**: All file uploads use `PutObjectCommand` to send directly to S3
- **Error Handling**: Proper try-catch and error responses for S3 failures

### API Endpoints
1. **POST `/api/google-genai-query`**: Accepts form data or PDF, uploads to S3, returns GenAI results
2. **POST `/api/save-preview-page`**: Reads preview.html, uploads to S3 with ISO timestamp

### Frontend (No Changes Required)
- HTML/CSS/JS files are static and require no modification
- All data operations use browser storage (localStorage/sessionStorage)
- File uploads and preview saves trigger `/api/` endpoints automatically

## Environment Configuration

### Required Environment Variables
```env
GOOGLE_API_KEY=<your-google-genai-api-key>
MODEL_ID=gemini-flash-lite-latest
S3_BUCKET=<your-s3-bucket-name>
AWS_REGION=us-east-1
PORT=3000
```

### AWS Credentials
Configure credentials via one of these methods:
1. **AWS CLI**: `aws configure`
2. **Environment variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
3. **IAM Role** (recommended for AWS services): Attach role with S3 PutObject permissions

## S3 Bucket Setup

### Bucket Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::freecaps/*"
    }
  ]
}
```

### Bucket Folder Structure
```
freecaps/
├── uploads/                    # PDF files from user uploads
│   └── {timestamp}-{filename}.pdf
└── match-res-previews/        # Generated preview HTML pages
    └── preview-{iso-timestamp}.html
```

## Deployment Steps

### Local Development
```bash
# Install dependencies
npm install

# Create .env with required variables
cat > .env << EOF
GOOGLE_API_KEY=your-api-key
MODEL_ID=gemini-flash-lite-latest
S3_BUCKET=freecaps
AWS_REGION=us-east-1
EOF

# Start server
node server.js
```

### AWS Lambda Deployment
1. Install serverless framework: `npm install -g serverless`
2. Configure AWS credentials
3. Create `serverless.yml`:
```yaml
service: college-match-app
provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    GOOGLE_API_KEY: ${env:GOOGLE_API_KEY}
    MODEL_ID: gemini-flash-lite-latest
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
4. Deploy: `serverless deploy`

### AWS App Runner Deployment
1. Push code to ECR or GitHub
2. Create App Runner service with:
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment variables: Same as .env file
   - Port: `3000`

## Testing Checklist

- [ ] Form submission works and generates matches
- [ ] PDF upload saves to S3 in `uploads/` folder
- [ ] Preview page saves to S3 in `match-res-previews/` folder with timestamp
- [ ] GenAI results display correctly in browser
- [ ] All API errors return proper messages
- [ ] No 500 errors related to S3 credentials
- [ ] Multiple users can submit without conflicts

## Troubleshooting

### "Missing S3_BUCKET environment variable"
- Ensure `.env` file has `S3_BUCKET=freecaps`
- Restart the server after updating `.env`

### "Failed to execute 'text' on 'Response': body stream already read"
- This was fixed in match.html line 813-815
- Ensure you're using the updated version

### S3 PutObject fails with permission denied
- Verify IAM role/user has `s3:PutObject` on `arn:aws:s3:::freecaps/*`
- Check AWS credentials are configured correctly
- Verify bucket exists and region matches AWS_REGION

### GenAI API errors
- Verify GOOGLE_API_KEY is valid and has quota remaining
- Check MODEL_ID is supported by your API key

## Monitoring

### CloudWatch Logs (AWS Lambda)
- Check `/aws/lambda/` logs for errors
- Monitor S3 PUT operations in CloudTrail

### Application Logs
- Server startup: "Server running on http://localhost:3000"
- S3 operations: "Unable to save preview page to S3:"
- GenAI queries: Console error messages

## File Manifest

### Server Files
- `server.js`: Express app with S3 integration (lines 1-342)
- `package.json`: Dependencies including @aws-sdk/client-s3
- `.env`: Environment variables (local development)

### Frontend Files
- `index.html`: Form entry page
- `match.html`: Form submission and GenAI query handler
- `results.html`: Display GenAI results
- `preview.html`: Preview and save functionality
- `styles.css`: Shared styling

### Configuration Files
- `.env`: Local environment variables (not committed to git)
- `.env.example`: Template for .env (can be committed)

## Post-Deployment

After deploying to AWS:

1. **Test the app** at your AWS endpoint
2. **Verify S3 objects** are created in correct folders
3. **Monitor CloudWatch Logs** for errors
4. **Set up auto-scaling** if using App Runner
5. **Configure backup** for S3 bucket if needed

## Security Notes

- ✅ No sensitive data stored on local filesystem
- ✅ Memory-based file handling (no temp files exposed)
- ✅ All S3 objects require proper IAM credentials
- ⚠️ API keys should be managed via AWS Secrets Manager, not .env files in production
- ⚠️ Enable S3 encryption for sensitive data
- ⚠️ Set object lifecycle policies to delete old previews

## Support

For issues with:
- **Frontend**: Check browser console for errors
- **Backend**: Check server logs (console output)
- **S3**: Verify bucket exists and permissions are correct
- **GenAI API**: Check Google GenAI documentation and API status
