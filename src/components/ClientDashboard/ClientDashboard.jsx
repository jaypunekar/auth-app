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
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
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
  Logout as LogoutIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
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
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [campaignTab, setCampaignTab] = useState(0);
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
          const campaign = customerCampaigns[0];
          setSelectedCampaign(campaign);
          if (campaign.source !== 'shared') {
            fetchCampaignAnalytics(firstCustomerId, customerCampaigns[0].id);
          }
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
      const anyGoogleCampaign = campaigns.find(c => c.customer_id === selectedCustomerId && c.source !== 'shared');
      if (anyGoogleCampaign) {
        fetchCombinedAnalytics(selectedCustomerId);
      }
    } else if (newValue === 1 && selectedCustomerId && selectedCampaignId) {
      // Campaign details tab - fetch specific campaign analytics
      if (selectedCampaign && selectedCampaign.source !== 'shared') {
        fetchCampaignAnalytics(selectedCustomerId, selectedCampaignId);
      }
    }
  };
  
  const handleCampaignSelect = (customerId, campaignId) => {
    setSelectedCustomerId(customerId);
    setSelectedCampaignId(campaignId);
    // Find the selected campaign object
    const campaign = campaigns.find(c => c.customer_id === customerId && c.id === campaignId);
    setSelectedCampaign(campaign);
    // Only fetch analytics for Google Ads campaigns
    if (campaign && campaign.source !== 'shared') {
      fetchCampaignAnalytics(customerId, campaignId);
    } else {
      setAnalyticsData(null);
    }
    setActiveTab(1);
  };
  
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    setSelectedCampaignId(null);
    setSelectedCampaign(null);
    // Only fetch analytics for Google Ads customers
    const anyGoogleCampaign = campaigns.find(c => c.customer_id === customerId && c.source !== 'shared');
    if (anyGoogleCampaign) {
      fetchCombinedAnalytics(customerId);
    } else {
      setAnalyticsData(null);
    }
    setActiveTab(0);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientInfo');
    navigate('/client-login');
  };

  const handleApprovalAction = (action) => {
    setApprovalAction(action);
    setApprovalDialogOpen(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedCampaign) return;
    
    setSubmittingApproval(true);
    try {
      const response = await axios.post(`/api/client-analytics/shared-campaigns/${selectedCampaign.id}/approve`, {
        status: approvalAction,
        feedback: feedback
      });
      
      if (response.data.success) {
        setSnackbarMessage(`Campaign ${approvalAction} successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Update the campaign in the list
        const updatedCampaigns = campaigns.map(c => 
          c.id === selectedCampaign.id 
            ? { ...c, approval_status: approvalAction }
            : c
        );
        setCampaigns(updatedCampaigns);
        
        // Update selected campaign
        setSelectedCampaign({ ...selectedCampaign, approval_status: approvalAction });
        
        setApprovalDialogOpen(false);
        setFeedback('');
        setApprovalAction('');
      }
    } catch (err) {
      console.error('Error submitting approval:', err);
      setSnackbarMessage('Failed to submit approval. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialogOpen(false);
    setFeedback('');
    setApprovalAction('');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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

  // Helper: filter campaigns that need review (pending and previously disapproved)
  const needsReviewCampaigns = campaigns.filter(c => {
    if (c.approval_status !== 'pending') return false;
    if (!c.approvals) return false;
    return c.approvals.some(a => a.status === 'disapproved');
  });

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
              <Tabs value={campaignTab} onChange={(_, v) => setCampaignTab(v)} sx={{ mb: 2 }}>
                <Tab label="All Campaigns" />
                <Tab label="Needs Your Review" />
              </Tabs>
              {campaignTab === 0 ? (
                Object.entries(customerCampaigns).length === 0 ? (
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
                              primary={campaign.source === 'shared' ? campaign.title : (campaign.name || campaign.title)}
                              secondary={campaign.source === 'shared' ? `Shared Campaign` : `Status: ${campaign.status || 'Unknown'}`}
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
                )
              ) : (
                // Needs Your Review tab
                needsReviewCampaigns.length === 0 ? (
                  <Alert severity="info">No campaigns need your review at this time.</Alert>
                ) : (
                  <List dense>
                    {needsReviewCampaigns.map(campaign => (
                      <ListItem
                        key={campaign.id}
                        button
                        selected={selectedCampaignId === campaign.id}
                        onClick={() => handleCampaignSelect(campaign.customer_id, campaign.id)}
                      >
                        <ListItemText
                          primary={campaign.title}
                          secondary={`Status: Pending Review`}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="View Details">
                            <IconButton edge="end" onClick={() => handleCampaignSelect(campaign.customer_id, campaign.id)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )
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
              ) : !analyticsData && selectedCampaign?.source !== 'shared' ? (
                <Alert severity="info">
                  Select a campaign or account to view analytics
                </Alert>
              ) : (
                <>
                  {/* Summary Cards */}
                  {analyticsData && (
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
                  )}
                  
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
                  {activeTab === 1 && selectedCampaignId && selectedCampaign && selectedCampaign.source === 'shared' && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Shared Campaign Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent>
                              <Typography variant="h5">{selectedCampaign.title}</Typography>
                              <Typography variant="body1" color="text.secondary" paragraph>
                                {selectedCampaign.description}
                              </Typography>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle1">Platform: {selectedCampaign.platform}</Typography>
                              <Typography variant="subtitle1">Budget: ${selectedCampaign.budget}</Typography>
                              <Typography variant="subtitle1">Start Date: {selectedCampaign.start_date}</Typography>
                              <Typography variant="subtitle1">End Date: {selectedCampaign.end_date}</Typography>
                              <Typography variant="subtitle1">Objective: {selectedCampaign.objective}</Typography>
                              <Typography variant="subtitle1">Website: {selectedCampaign.website_url}</Typography>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle1">Headlines:</Typography>
                              <List dense>
                                {selectedCampaign.headlines && selectedCampaign.headlines.map((h, i) => (
                                  <ListItem key={i}><ListItemText primary={h} /></ListItem>
                                ))}
                              </List>
                              <Typography variant="subtitle1">Descriptions:</Typography>
                              <List dense>
                                {selectedCampaign.descriptions && selectedCampaign.descriptions.map((d, i) => (
                                  <ListItem key={i}><ListItemText primary={d} /></ListItem>
                                ))}
                              </List>
                              <Typography variant="subtitle1">Keywords:</Typography>
                              <List dense>
                                {selectedCampaign.keywords && selectedCampaign.keywords.map((k, i) => (
                                  <ListItem key={i}><ListItemText primary={k} /></ListItem>
                                ))}
                              </List>
                              <Typography variant="subtitle1">Target Audience:</Typography>
                              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>{JSON.stringify(selectedCampaign.target_audience, null, 2)}</pre>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle1">Approval Status: {selectedCampaign.approval_status || 'Pending'}</Typography>
                              
                              {/* Approval Actions */}
                              {(!selectedCampaign.approval_status || selectedCampaign.approval_status === 'pending') && (
                                <Box sx={{ mt: 3 }}>
                                  <Typography variant="h6" gutterBottom>
                                    Campaign Approval
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Button
                                      variant="contained"
                                      color="success"
                                      startIcon={<ThumbUpIcon />}
                                      onClick={() => handleApprovalAction('approved')}
                                    >
                                      Approve Campaign
                                    </Button>
                                    <Button
                                      variant="contained"
                                      color="error"
                                      startIcon={<ThumbDownIcon />}
                                      onClick={() => handleApprovalAction('disapproved')}
                                    >
                                      Disapprove Campaign
                                    </Button>
                                  </Box>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={handleCloseApprovalDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approved' ? 'Approve Campaign' : 'Disapprove Campaign'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Please provide feedback for this campaign:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts about this campaign..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApprovalDialog} disabled={submittingApproval}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitApproval}
            variant="contained"
            color={approvalAction === 'approved' ? 'success' : 'error'}
            disabled={submittingApproval || (approvalAction === 'disapproved' && (!feedback || feedback.trim() === ''))}
          >
            {submittingApproval ? <CircularProgress size={24} /> : (approvalAction === 'approved' ? 'Approve' : 'Disapprove')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClientDashboard; 