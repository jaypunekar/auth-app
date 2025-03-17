# Deployment Guide for AWS Amplify

This guide provides instructions for deploying the Ad Campaign Manager frontend to AWS Amplify.

## Prerequisites

- An AWS account
- The AWS Amplify CLI installed and configured
- Your backend API deployed to AWS Elastic Beanstalk or another service

## Deployment Steps

### 1. Set up your repository in AWS Amplify

1. Log in to the AWS Management Console
2. Navigate to AWS Amplify
3. Click "New app" > "Host web app"
4. Choose your repository provider (GitHub, BitBucket, etc.)
5. Select your repository and branch
6. Configure build settings (use the default settings or customize as needed)

### 2. Configure Environment Variables

In the Amplify Console:

1. Go to "Environment variables"
2. Add the following variables:
   - `API_URL`: The URL of your backend API (e.g., `https://api.yourdomain.com`)
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (if needed)

These variables will be used by the `.env.production` file to set the correct values for your React app.

### 3. Update CORS Configuration in Backend

Ensure your backend API allows requests from your Amplify domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-amplify-domain.amplifyapp.com", "https://prod.adtask.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Authentication Troubleshooting

If you encounter authentication issues:

1. **Check JWT Token Storage**: Ensure the JWT token is being stored in localStorage after login
2. **Verify Token Inclusion**: Confirm the token is being included in the Authorization header for API requests
3. **Check CORS Headers**: Verify that your backend is returning the correct CORS headers
4. **Browser Console**: Look for CORS or authentication errors in the browser console

Common issues:

- **401 Unauthorized**: The JWT token is missing or invalid
- **CORS Errors**: The backend is not configured to allow requests from your Amplify domain
- **Cookie Issues**: Cross-domain cookies require specific configurations

### 5. Monitoring and Debugging

1. Use the AWS Amplify Console to view build logs and deployment status
2. Check CloudWatch Logs for backend API errors
3. Use browser developer tools to inspect network requests and responses

## Custom Domain Setup

To use a custom domain with your Amplify app:

1. In the Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain name and follow the instructions to verify ownership
4. Update your DNS settings as instructed by Amplify

Remember to update your backend CORS configuration to include your custom domain.

## Continuous Deployment

AWS Amplify supports continuous deployment from your repository. When you push changes to your configured branch, Amplify will automatically build and deploy your app.

To disable automatic deployments:

1. Go to the Amplify Console
2. Select your app
3. Go to "Build settings"
4. Toggle off "Continuous deployment" 