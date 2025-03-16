# Ad Campaign Manager Frontend

This is the frontend for the Ad Campaign Manager application.

## Environment Variables

The application uses environment variables for configuration. These are set in the `.env` file for local development and in AWS Amplify for production.

### Local Development

For local development, create a `.env` file in the root of the project with the following variables:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Production Deployment (AWS Amplify)

When deploying to AWS Amplify, follow these steps:

1. Go to the AWS Amplify Console
2. Select your app or create a new one
3. Connect to your GitHub repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Output directory: `build`
5. Go to "Environment variables" and add the following:
   - `API_URL`: The URL of your backend API (e.g., `https://api.yourdomain.com` or your Elastic Beanstalk URL)
   - `ANTHROPIC_API_KEY`: Your Anthropic API key

#### Important Notes for AWS Amplify Deployment

1. **CORS Configuration**: Ensure your backend has the correct CORS configuration to allow requests from your Amplify domain.

2. **Authentication**: The app uses JWT tokens for authentication. Make sure your backend is configured to accept these tokens.

3. **API Endpoints**: The frontend expects the backend API to be available at `${API_URL}/api`. Make sure your backend is configured accordingly.

4. **Redirects**: If you're using client-side routing, add the following redirect rule in the Amplify Console:
   ```json
   [
     {
       "source": "/<*>",
       "target": "/index.html",
       "status": "200",
       "condition": null
     }
   ]
   ```

## Troubleshooting

### CORS Issues

If you encounter CORS issues, make sure your backend's CORS configuration includes your Amplify domain. In your backend's `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://your-amplify-domain.amplifyapp.com",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Authentication Issues

If you encounter authentication issues, check the browser console for errors. Make sure the JWT token is being correctly stored and sent with requests.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. 