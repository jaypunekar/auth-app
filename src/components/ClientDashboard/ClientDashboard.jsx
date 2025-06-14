import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Visibility as ViewIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
  const [clientInfo, setClientInfo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const navigate = useNavigate();

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    // Check if client is logged in
    const token = localStorage.getItem('clientToken');
    const storedClientInfo = localStorage.getItem('clientInfo');
    
    if (!token || !storedClientInfo) {
      navigate('/client-login');
      return;
    }
    
    setClientInfo(JSON.parse(storedClientInfo));
    
    // Set up axios interceptor for client token
    const interceptor = axios.interceptors.request.use(
      config => {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      error => Promise.reject(error)
    );
    
    // Fetch accessible campaigns
    fetchCampaigns();
    
    return () => {
      // Remove interceptor when component unmounts
      axios.interceptors.request.eject(interceptor);
    };
  }, [navigate]);
  
  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/client-analytics/accessible-campaigns');
      setCampaigns(response.data.data.campaigns || []);
      
      // Set first customer and campaign as selected if available
      if (response.data.data.campaigns && response.data.data.campaigns.length > 0) {
        const firstCustomerId = response.data.data.campaigns[0].customer_id;
        setSelectedCustomerId(firstCustomerId);
        
        // Find campaigns for this customer
        const customerCampaigns = response.data.data.campaigns.filter(
          c => c.customer_id === firstCustomerId
        );
        
        if (customerCampaigns.length > 0) {
          setSelectedCampaignId(customerCampaigns[0].id);
          fetchCampaignAnalytics(firstCustomerId, customerCampaigns[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load your campaigns. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCampaignAnalytics = async (customerId, campaignId) => {
    if (!customerId) return;
    
    setAnalyticsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/client-analytics/campaign-performance/${customerId}`, {
        params: { campaign_id: campaignId }
      });
      
      setAnalyticsData(response.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const fetchCombinedAnalytics = async (customerId) => {
    if (!customerId) return;
    
    setAnalyticsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/client-analytics/combined-analytics/${customerId}`);
      setAnalyticsData(response.data.data);
    } catch (err) {
      console.error('Error fetching combined analytics:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    if (newValue === 0 && selectedCustomerId) {
      // Overview tab - fetch combined analytics
      fetchCombinedAnalytics(selectedCustomerId);
    } else if (newValue === 1 && selectedCustomerId && selectedCampaignId) {
      // Campaign details tab - fetch specific campaign analytics
      fetchCampaignAnalytics(selectedCustomerId, selectedCampaignId);
    }
  };
  
  const handleCampaignSelect = (customerId, campaignId) => {
    setSelectedCustomerId(customerId);
    setSelectedCampaignId(campaignId);
    
    // Fetch analytics for the selected campaign
    fetchCampaignAnalytics(customerId, campaignId);
    
    // Switch to campaign details tab
    setActiveTab(1);
  };
  
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    setSelectedCampaignId(null);
    
    // Fetch combined analytics for this customer
    fetchCombinedAnalytics(customerId);
    
    // Switch to overview tab
    setActiveTab(0);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientInfo');
    navigate('/client-login');
  };
  
  // Group campaigns by customer
  const customerCampaigns = {};
  campaigns.forEach(campaign => {
    if (!customerCampaigns[campaign.customer_id]) {
      customerCampaigns[campaign.customer_id] = [];
    }
    customerCampaigns[campaign.customer_id].push(campaign);
  });
  
  // Prepare data for charts
  const prepareChartData = (data) => {
    if (!data || !data.campaign_metrics) return [];
    
    return Object.entries(data.campaign_metrics).map(([date, metrics]) => ({
      date,
      impressions: metrics.impressions || 0,
      clicks: metrics.clicks || 0,
      cost: parseFloat(metrics.cost) || 0,
      conversions: metrics.conversions || 0,
      ctr: parseFloat(metrics.ctr) || 0
    }));
  };
  
  const chartData = prepareChartData(analyticsData);
  
  // Prepare data for pie chart
  const preparePieData = (data) => {
    if (!data || !data.campaign_distribution) return [];
    
    return Object.entries(data.campaign_distribution).map(([name, value]) => ({
      name,
      value: parseFloat(value) || 0
    }));
  };
  
  const pieData = preparePieData(analyticsData);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header with client info */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Campaign Analytics Dashboard
            </Typography>
            {clientInfo && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {clientInfo.first_name} {clientInfo.last_name} 
                  {clientInfo.email && ` (${clientInfo.email})`}
                </Typography>
              </Box>
            )}
            {clientInfo && clientInfo.company_name && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="body1">{clientInfo.company_name}</Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Campaign List */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Campaigns
              </Typography>
              
              {Object.entries(customerCampaigns).length === 0 ? (
                <Alert severity="info">
                  No campaigns available. Please contact your account manager.
                </Alert>
              ) : (
                Object.entries(customerCampaigns).map(([customerId, campaigns]) => (
                  <Box key={customerId} sx={{ mb: 3 }}>
                    <Button
                      fullWidth
                      variant={selectedCustomerId === customerId && !selectedCampaignId ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => handleCustomerSelect(customerId)}
                      sx={{ mb: 1 }}
                    >
                      Account: {customerId.substring(0, 6)}... (All Campaigns)
                    </Button>
                    
                    <List dense>
                      {campaigns.map(campaign => (
                        <ListItem
                          key={campaign.id}
                          button
                          selected={selectedCampaignId === campaign.id}
                          onClick={() => handleCampaignSelect(customerId, campaign.id)}
                        >
                          <ListItemText
                            primary={campaign.name}
                            secondary={`Status: ${campaign.status || 'Unknown'}`}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="View Details">
                              <IconButton edge="end" onClick={() => handleCampaignSelect(customerId, campaign.id)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
          
          {/* Analytics Display */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Campaign Details" disabled={!selectedCampaignId} />
              </Tabs>
              
              {analyticsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : !analyticsData ? (
                <Alert severity="info">
                  Select a campaign or account to view analytics
                </Alert>
              ) : (
                <>
                  {/* Summary Cards */}
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Impressions
                          </Typography>
                          <Typography variant="h5">
                            {analyticsData.overall_metrics?.total_impressions?.toLocaleString() || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Clicks
                          </Typography>
                          <Typography variant="h5">
                            {analyticsData.overall_metrics?.total_clicks?.toLocaleString() || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Cost
                          </Typography>
                          <Typography variant="h5">
                            ${analyticsData.overall_metrics?.total_cost?.toFixed(2) || '0.00'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            CTR
                          </Typography>
                          <Typography variant="h5">
                            {analyticsData.overall_metrics?.average_ctr?.toFixed(2) || '0.00'}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            CPC
                          </Typography>
                          <Typography variant="h5">
                            ${analyticsData.overall_metrics?.average_cpc?.toFixed(2) || '0.00'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Conversions
                          </Typography>
                          <Typography variant="h5">
                            {analyticsData.overall_metrics?.total_conversions?.toLocaleString() || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  {/* Performance Chart */}
                  {chartData.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Performance Over Time
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <ChartTooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#8884d8" name="Impressions" />
                          <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
                          <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#ff7300" name="Cost ($)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                  
                  {/* Distribution Chart (for overview) */}
                  {activeTab === 0 && pieData.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Campaign Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                  
                  {/* Campaign Details (for campaign tab) */}
                  {activeTab === 1 && selectedCampaignId && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Campaign Details
                      </Typography>
                      
                      {/* Additional campaign-specific metrics could go here */}
                      {analyticsData.campaign_details && (
                        <Grid container spacing={2}>
                          {Object.entries(analyticsData.campaign_details).map(([key, value]) => (
                            <Grid item xs={6} sm={4} key={key}>
                              <Card>
                                <CardContent>
                                  <Typography color="textSecondary" gutterBottom>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Typography>
                                  <Typography variant="body1">
                                    {typeof value === 'number' ? value.toLocaleString() : value.toString()}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ClientDashboard; 