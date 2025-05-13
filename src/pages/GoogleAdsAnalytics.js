import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Phone as PhoneIcon,
  Computer as ComputerIcon,
  Tablet as TabletIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  Visibility as VisibilityIcon,
  TouchApp as TouchAppIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GoogleAdsAnalytics = () => {
  const { subscription } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const canUseGoogleAds = subscription?.features?.can_use_google_ads || false;
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658'
  ];
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Format large numbers with k, M, etc.
  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Load analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/google-ads/combined-analytics');
        
        if (response.data.success) {
          setAnalyticsData(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    if (canUseGoogleAds) {
      fetchAnalyticsData();
    } else {
      setLoading(false);
    }
  }, [canUseGoogleAds]);
  
  // Prepare data for device distribution pie chart
  const getDeviceDistributionData = () => {
    if (!analyticsData || !analyticsData.device_metrics) return [];
    
    return Object.entries(analyticsData.device_metrics).map(([device, metrics]) => ({
      name: device,
      value: metrics.impressions
    }));
  };
  
  // Prepare data for weekday performance chart
  const getWeekdayPerformanceData = () => {
    if (!analyticsData || !analyticsData.weekday_performance) return [];
    
    // Order days of week properly
    const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    return daysOrder
      .filter(day => analyticsData.weekday_performance[day])
      .map(day => ({
        name: day.charAt(0) + day.slice(1).toLowerCase(),
        clicks: analyticsData.weekday_performance[day].clicks,
        impressions: analyticsData.weekday_performance[day].impressions,
        cost: analyticsData.weekday_performance[day].cost
      }));
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }
  
  // Render if Google Ads feature is not available
  if (!canUseGoogleAds) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Google Ads Analytics
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Feature Not Available</AlertTitle>
            Google Ads features are only available on Pro or Enterprise plans.
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/subscriptions')}
          >
            Upgrade Plan
          </Button>
        </Paper>
      </Box>
    );
  }
  
  // Render if no analytics data is available
  if (!analyticsData || !analyticsData.overall_metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Google Ads Analytics
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>No Data Available</AlertTitle>
            No Google Ads analytics data is available. Make sure you have an active Google Ads account linked and running campaigns.
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Google Ads Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Comprehensive analytics for all your Google Ads campaigns in one place.
        </Typography>
      </Paper>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <VisibilityIcon sx={{ mr: 1, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                Total Impressions
              </Typography>
              <Typography variant="h4">
                {formatNumber(analyticsData.overall_metrics.total_impressions || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <TouchAppIcon sx={{ mr: 1, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                Total Clicks
              </Typography>
              <Typography variant="h4">
                {formatNumber(analyticsData.overall_metrics.total_clicks || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <MonetizationOnIcon sx={{ mr: 1, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                Total Spend
              </Typography>
              <Typography variant="h4">
                {formatCurrency(analyticsData.overall_metrics.total_cost || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                Average CTR
              </Typography>
              <Typography variant="h4">
                {formatPercentage(analyticsData.overall_metrics.average_ctr || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for different analytics views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Campaign Performance" />
          <Tab label="Device & Time Analysis" />
          <Tab label="Trends" />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Impressions</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatNumber(analyticsData.overall_metrics.total_impressions || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Clicks</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatNumber(analyticsData.overall_metrics.total_clicks || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Total Cost</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(analyticsData.overall_metrics.total_cost || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Conversions</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatNumber(analyticsData.overall_metrics.total_conversions || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Average CTR</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatPercentage(analyticsData.overall_metrics.average_ctr || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Average CPC</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(analyticsData.overall_metrics.average_cpc || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Device Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={getDeviceDistributionData()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill={theme.palette.primary.main}
                        label={(entry) => entry.name}
                      >
                        {getDeviceDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Trend (Last 30 Days)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={analyticsData.trend_data}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        // Format YYYYMMDD to MM/DD
                        const year = date.substring(0, 4);
                        const month = date.substring(4, 6);
                        const day = date.substring(6, 8);
                        return `${month}/${day}`;
                      }} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'cost') return formatCurrency(value);
                        return formatNumber(value);
                      }}
                      labelFormatter={(date) => {
                        // Format YYYYMMDD to YYYY-MM-DD
                        const year = date.substring(0, 4);
                        const month = date.substring(4, 6);
                        const day = date.substring(6, 8);
                        return `${year}-${month}-${day}`;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="clicks" stroke={theme.palette.primary.main} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="impressions" stroke={theme.palette.secondary.main} />
                    <Line type="monotone" dataKey="cost" stroke={theme.palette.error.main} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Campaign Performance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Campaign Performance Comparison
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table sx={{ minWidth: 650 }} aria-label="campaign performance table">
              <TableHead>
                <TableRow>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Impressions</TableCell>
                  <TableCell align="right">Clicks</TableCell>
                  <TableCell align="right">CTR</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Avg. CPC</TableCell>
                  <TableCell align="right">Conversions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.campaign_comparison.map((campaign) => (
                  <TableRow key={campaign.campaign_id}>
                    <TableCell component="th" scope="row">
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={campaign.status} 
                        size="small"
                        color={
                          campaign.status === 'ENABLED' ? 'success' : 
                          campaign.status === 'PAUSED' ? 'default' : 
                          'error'
                        } 
                      />
                    </TableCell>
                    <TableCell align="right">{formatNumber(campaign.impressions)}</TableCell>
                    <TableCell align="right">{formatNumber(campaign.clicks)}</TableCell>
                    <TableCell align="right">{formatPercentage(campaign.ctr)}</TableCell>
                    <TableCell align="right">{formatCurrency(campaign.cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(campaign.average_cpc)}</TableCell>
                    <TableCell align="right">{formatNumber(campaign.conversions)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="h6" gutterBottom>
            Campaign Cost Comparison
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analyticsData.campaign_comparison}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill={theme.palette.primary.main} name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          
          <Typography variant="h6" gutterBottom>
            Campaign Performance Metrics
          </Typography>
          <Paper sx={{ p: 2 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analyticsData.campaign_comparison}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'CTR') return formatPercentage(value);
                    return formatNumber(value);
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="clicks" fill={theme.palette.primary.main} name="Clicks" />
                <Bar yAxisId="right" dataKey="ctr" fill={theme.palette.secondary.main} name="CTR" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>
        
        {/* Device & Time Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Device Performance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Device</TableCell>
                        <TableCell align="right">Impressions</TableCell>
                        <TableCell align="right">Clicks</TableCell>
                        <TableCell align="right">CTR</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(analyticsData.device_metrics).map(([device, metrics]) => (
                        <TableRow key={device}>
                          <TableCell>
                            {device === 'MOBILE' && <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                            {device === 'COMPUTER' && <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                            {device === 'TABLET' && <TabletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                            {device}
                          </TableCell>
                          <TableCell align="right">{formatNumber(metrics.impressions)}</TableCell>
                          <TableCell align="right">{formatNumber(metrics.clicks)}</TableCell>
                          <TableCell align="right">{formatPercentage(metrics.ctr)}</TableCell>
                          <TableCell align="right">{formatCurrency(metrics.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Device Distribution (Clicks)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analyticsData.device_metrics).map(([device, metrics]) => ({
                        name: device,
                        value: metrics.clicks
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill={theme.palette.primary.main}
                      label
                    >
                      {Object.entries(analyticsData.device_metrics).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Day of Week Performance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={getWeekdayPerformanceData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'cost') return formatCurrency(value);
                        return formatNumber(value);
                      }}
                    />
                    <Legend />
                    <Bar dataKey="clicks" fill={theme.palette.primary.main} name="Clicks" />
                    <Bar dataKey="impressions" fill={theme.palette.secondary.main} name="Impressions" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Trends Tab */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Impressions & Clicks Over Time
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analyticsData.trend_data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    // Format YYYYMMDD to MM/DD
                    const year = date.substring(0, 4);
                    const month = date.substring(4, 6);
                    const day = date.substring(6, 8);
                    return `${month}/${day}`;
                  }} 
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatNumber(value)}
                  labelFormatter={(date) => {
                    // Format YYYYMMDD to YYYY-MM-DD
                    const year = date.substring(0, 4);
                    const month = date.substring(4, 6);
                    const day = date.substring(6, 8);
                    return `${year}-${month}-${day}`;
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke={theme.palette.primary.main} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke={theme.palette.secondary.main} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cost & Conversions Over Time
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analyticsData.trend_data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    // Format YYYYMMDD to MM/DD
                    const year = date.substring(0, 4);
                    const month = date.substring(4, 6);
                    const day = date.substring(6, 8);
                    return `${month}/${day}`;
                  }} 
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Cost') return formatCurrency(value);
                    return formatNumber(value);
                  }}
                  labelFormatter={(date) => {
                    // Format YYYYMMDD to YYYY-MM-DD
                    const year = date.substring(0, 4);
                    const month = date.substring(4, 6);
                    const day = date.substring(6, 8);
                    return `${year}-${month}-${day}`;
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cost" stroke={theme.palette.error.main} name="Cost" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" stroke={theme.palette.success.main} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Daily Performance Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Impressions</TableCell>
                    <TableCell align="right">Clicks</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Conversions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.trend_data.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>
                        {`${day.date.substring(4, 6)}/${day.date.substring(6, 8)}/${day.date.substring(0, 4)}`}
                      </TableCell>
                      <TableCell align="right">{formatNumber(day.impressions)}</TableCell>
                      <TableCell align="right">{formatNumber(day.clicks)}</TableCell>
                      <TableCell align="right">{formatCurrency(day.cost)}</TableCell>
                      <TableCell align="right">{formatNumber(day.conversions)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default GoogleAdsAnalytics; 