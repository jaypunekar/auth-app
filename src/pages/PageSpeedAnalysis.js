import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  useTheme,
  Tooltip as MuiTooltip,
  Alert,
  Fade,
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material';
import { 
  Speed as SpeedIcon,
  DevicesOther as DevicesIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PageSpeedAnalysis = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('mobile');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState(null);
  const theme = useTheme();

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAnalyze = async () => {
    if (!url) return;

    // Reset states
    setLoading(true);
    setResults(null);
    setError(null);
    
    // Add http:// if not present
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }
    
    // Simulate the analysis steps
    setAnalysisStep(1);
    
    // Use setTimeout to simulate the analysis process steps
    const step2Timeout = setTimeout(() => setAnalysisStep(2), 2000);
    const step3Timeout = setTimeout(() => setAnalysisStep(3), 4000);
    
    try {
      const response = await axios.get(`/api/pagespeed/analyze?url=${encodeURIComponent(formattedUrl)}`);
      
      // Validate response data
      if (!response.data) {
        throw new Error('No data received from the server');
      }
      
      // Check if we have both mobile and desktop data
      if (!response.data.mobile || !response.data.desktop) {
        // We still have some data, so we'll show what we have
        console.warn('Incomplete data received:', response.data);
      }
      
      setResults(response.data);
      setAnalysisStep(4);
    } catch (error) {
      console.error('Error analyzing website:', error);
      
      // Clear timeouts
      clearTimeout(step2Timeout);
      clearTimeout(step3Timeout);
      
      // Set appropriate error message
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
          setError('The website could not be found. Please check the URL and try again.');
        } else if (error.response.status === 400) {
          setError('Invalid URL format. Please enter a valid website address.');
        } else if (error.response.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError(`Server error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return <CheckCircleIcon style={{ color: theme.palette.success.main }} />;
    if (score >= 50) return <WarningIcon style={{ color: theme.palette.warning.main }} />;
    return <ErrorIcon style={{ color: theme.palette.error.main }} />;
  };

  const formatMetricName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderPerformanceScore = () => {
    if (!results || !results[activeTab]) return null;
    
    try {
      // Check if performance_score exists
      if (results[activeTab].performance_score === undefined || results[activeTab].performance_score === null) {
        return (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Alert severity="warning">
              <Typography variant="body1">
                No performance score available for this website.
              </Typography>
            </Alert>
          </Box>
        );
      }
      
      const score = results[activeTab].performance_score;
      
      return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={200}
              thickness={4}
              sx={{ color: theme.palette.grey[200] }}
            />
            <CircularProgress
              variant="determinate"
              value={score}
              size={200}
              thickness={4}
              sx={{ 
                color: getScoreColor(score),
                position: 'absolute',
                left: 0,
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h3" component="div" color="text.primary">
                {Math.round(score)}
              </Typography>
            </Box>
          </Box>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Performance Score
          </Typography>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering performance score:', error);
      return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Alert severity="error">
            <Typography variant="body1">
              An error occurred while rendering the performance score.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Error details: {error.message}
            </Typography>
          </Alert>
        </Box>
      );
    }
  };

  const renderMetricsChart = () => {
    if (!results || !results[activeTab]) return null;
    
    const metrics = results[activeTab].metrics;
    
    // Check if metrics exists and is an object
    if (!metrics || typeof metrics !== 'object') {
      return (
        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Core Web Vitals
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body1">
              No metrics data available for this website. This could be due to:
            </Typography>
            <ul>
              <li>The website is not accessible</li>
              <li>The analysis is still in progress</li>
              <li>There was an error retrieving the metrics</li>
            </ul>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Try analyzing the website again or check if the URL is correct.
            </Typography>
          </Alert>
        </Box>
      );
    }
    
    try {
      const chartData = Object.entries(metrics).map(([key, value]) => ({
        name: formatMetricName(key),
        score: value?.score || 0,
        displayValue: value?.display_value || 'N/A'
      }));
      
      if (chartData.length === 0) {
        return (
          <Box sx={{ height: 400, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Core Web Vitals
            </Typography>
            <Alert severity="info">
              No performance metrics available for this website.
            </Alert>
          </Box>
        );
      }
      
      return (
        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Core Web Vitals
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={150} />
              <RechartsTooltip 
                formatter={(value, name, props) => {
                  if (!props || !props.payload) return [value, name];
                  return [`${value.toFixed(0)}% (${props.payload.displayValue || 'N/A'})`, name];
                }}
              />
              <Legend />
              <Bar 
                dataKey="score" 
                name="Score" 
                isAnimationActive={true}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering metrics chart:', error);
      return (
        <Box sx={{ height: 400, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Core Web Vitals
          </Typography>
          <Alert severity="error">
            <Typography variant="body1">
              An error occurred while rendering the performance metrics.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Error details: {error.message}
            </Typography>
          </Alert>
        </Box>
      );
    }
  };

  const renderOpportunities = () => {
    if (!results || !results[activeTab]) return null;
    
    try {
      // Check if opportunities exists
      if (!results[activeTab].opportunities) {
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Improvement Opportunities
            </Typography>
            <Alert severity="info">
              <Typography variant="body1">
                No improvement opportunities data available.
              </Typography>
            </Alert>
          </Box>
        );
      }
      
      const opportunities = results[activeTab].opportunities;
      if (!Array.isArray(opportunities) || opportunities.length === 0) {
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Improvement Opportunities
            </Typography>
            <Typography>No improvement opportunities found.</Typography>
          </Box>
        );
      }
      
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Improvement Opportunities
          </Typography>
          <List>
            {opportunities.map((opportunity, index) => (
              <ListItem key={index} alignItems="flex-start" divider>
                <ListItemIcon>
                  {getScoreIcon(opportunity.score || 0)}
                </ListItemIcon>
                <ListItemText
                  primary={opportunity.title || 'Unnamed Opportunity'}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {opportunity.description || 'No description available'}
                      </Typography>
                      {(opportunity.savings_ms > 0) && (
                        <Typography variant="body2" color="text.secondary">
                          Potential savings: {opportunity.savings_ms}ms
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering opportunities:', error);
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Improvement Opportunities
          </Typography>
          <Alert severity="error">
            <Typography variant="body1">
              An error occurred while rendering the improvement opportunities.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Error details: {error.message}
            </Typography>
          </Alert>
        </Box>
      );
    }
  };

  const renderDiagnostics = () => {
    if (!results || !results[activeTab]) return null;
    
    try {
      // Check if diagnostics exists
      if (!results[activeTab].diagnostics) {
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Diagnostics
            </Typography>
            <Alert severity="info">
              <Typography variant="body1">
                No diagnostics data available.
              </Typography>
            </Alert>
          </Box>
        );
      }
      
      const diagnostics = results[activeTab].diagnostics;
      if (!Array.isArray(diagnostics) || diagnostics.length === 0) {
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Diagnostics
            </Typography>
            <Typography>No diagnostics found.</Typography>
          </Box>
        );
      }
      
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Diagnostics
          </Typography>
          <List>
            {diagnostics.map((diagnostic, index) => (
              <ListItem key={index} alignItems="flex-start" divider>
                <ListItemIcon>
                  {getScoreIcon(diagnostic.score || 0)}
                </ListItemIcon>
                <ListItemText
                  primary={diagnostic.title || 'Unnamed Diagnostic'}
                  secondary={diagnostic.description || 'No description available'}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering diagnostics:', error);
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Diagnostics
          </Typography>
          <Alert severity="error">
            <Typography variant="body1">
              An error occurred while rendering the diagnostics.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Error details: {error.message}
            </Typography>
          </Alert>
        </Box>
      );
    }
  };

  const renderLoadingState = () => {
    const steps = [
      'Preparing analysis',
      'Checking mobile performance',
      'Checking desktop performance',
      'Generating report'
    ];

    return (
      <Fade in={loading} timeout={500}>
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            
            <Typography variant="h5" gutterBottom>
              Analyzing Your Website
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We're performing a comprehensive analysis of your website. This process may take a few minutes as we check various performance metrics, accessibility features, and best practices.
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={(analysisStep / 4) * 100} 
              sx={{ height: 10, borderRadius: 5, mb: 3 }} 
            />
            
            <Stepper activeStep={analysisStep - 1} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Did you know?</strong> Website performance directly impacts user experience and conversion rates. A 1-second delay in page load time can result in a 7% reduction in conversions.
              </Typography>
            </Alert>
          </Box>
        </Paper>
      </Fade>
    );
  };

  const renderHelpSection = () => {
    return (
      <Paper sx={{ p: 3, mb: 4, bgcolor: theme.palette.grey[50] }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <LightbulbIcon color="primary" fontSize="large" />
          </Grid>
          <Grid item xs>
            <Typography variant="h6">
              What is Website Performance Analysis?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This tool checks how well your website performs on mobile and desktop devices. It measures loading speed, interactivity, and visual stability - factors that affect user experience and search engine rankings.
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            What do the scores mean?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                <Typography variant="body2">90-100: Good</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                <Typography variant="body2">50-89: Needs Improvement</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ErrorIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                <Typography variant="body2">0-49: Poor</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Website Performance Analysis
      </Typography>
      <Typography variant="body1" paragraph>
        Analyze your website's performance using Google PageSpeed Insights. Get detailed metrics, improvement opportunities, and diagnostics.
      </Typography>
      
      {!results && !loading && !error && renderHelpSection()}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Website URL"
              variant="outlined"
              value={url}
              onChange={handleUrlChange}
              placeholder="Enter your website URL (e.g., example.com)"
              helperText="No need to include http:// or https://"
              disabled={loading}
              error={!!error}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleAnalyze}
              disabled={loading || !url}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SpeedIcon />}
              size="large"
              sx={{ py: 1.5 }}
            >
              {loading ? 'Analyzing...' : 'Analyze Website'}
            </Button>
          </Grid>
        </Grid>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body1">{error}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please check the URL and try again, or try a different website.
            </Typography>
          </Alert>
        )}
      </Paper>

      {loading && renderLoadingState()}

      {results && (
        <>
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab 
                icon={<DevicesIcon />} 
                label="Mobile" 
                value="mobile" 
                iconPosition="start"
              />
              <Tab 
                icon={<DevicesIcon />} 
                label="Desktop" 
                value="desktop" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Why {activeTab === 'mobile' ? 'mobile' : 'desktop'} performance matters:</strong> {activeTab === 'mobile' ? 'Over 60% of web traffic comes from mobile devices. Google primarily uses mobile performance for search rankings.' : 'Desktop users expect faster experiences and often perform more complex tasks like checkouts and form submissions.'}
            </Typography>
          </Alert>

          <Grid container spacing={4}>
            <Grid item xs={12}>
              {renderPerformanceScore()}
            </Grid>
            
            <Grid item xs={12}>
              {renderMetricsChart()}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  {renderOpportunities()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  {renderDiagnostics()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, p: 3, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <HelpIcon sx={{ mr: 1 }} /> Need help improving your score?
            </Typography>
            <Typography variant="body2">
              Our marketing assistant can provide personalized recommendations to improve your website performance. 
              Head over to the <Button variant="text" onClick={() => window.location.href = '/chat'}>Chat with Assistant</Button> page to get expert advice.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PageSpeedAnalysis; 