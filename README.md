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

When deploying to AWS Amplify, you need to set the environment variables in the Amplify Console:

1. Go to the AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add the following environment variables:
   - `API_URL`: The URL of your backend API (e.g., `https://api.yourdomain.com`)
   - `ANTHROPIC_API_KEY`: Your Anthropic API key

The `.env.production` file in the project will use these variables to set the correct values for the React app.

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