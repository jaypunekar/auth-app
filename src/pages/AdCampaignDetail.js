import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  InfoOutlined as InfoIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { adCampaignAPI } from '../services/api';
// Import recharts components for analytics graphs
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

// Sample data for analytics charts
const impressionsData = [
  { name: 'Mon', value: 0 },
  { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 },
  { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 },
  { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
];

const clicksData = [
  { name: 'Mon', value: 0 },
  { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 },
  { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 },
  { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
];

const conversionData = [
  { name: 'Impressions', value: 0 },
  { name: 'Clicks', value: 0 },
  { name: 'Conversions', value: 0 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const AdCampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState(0);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch campaign data from API
        const response = await adCampaignAPI.getCampaign(id);
        const campaignData = response.data;
        
        console.log('Raw campaign data:', campaignData); // Debug log
        
        // Parse dates
        if (campaignData.start_date) {
          try {
            campaignData.start_date = new Date(campaignData.start_date);
            console.log('Parsed start_date:', campaignData.start_date); // Debug log
          } catch (e) {
            console.error('Error parsing start_date:', e);
            campaignData.start_date = null;
          }
        }
        
        if (campaignData.end_date) {
          try {
            campaignData.end_date = new Date(campaignData.end_date);
            console.log('Parsed end_date:', campaignData.end_date); // Debug log
          } catch (e) {
            console.error('Error parsing end_date:', e);
            campaignData.end_date = null;
          }
        }
        
        if (campaignData.created_at) {
          try {
            campaignData.created_at = new Date(campaignData.created_at);
          } catch (e) {
            console.error('Error parsing created_at:', e);
            campaignData.created_at = null;
          }
        }
        
        if (campaignData.updated_at) {
          try {
            campaignData.updated_at = new Date(campaignData.updated_at);
          } catch (e) {
            console.error('Error parsing updated_at:', e);
            campaignData.updated_at = null;
          }
        }
        
        // Parse target audience if it's a JSON string
        if (typeof campaignData.target_audience === 'string') {
          try {
            campaignData.target_audience = JSON.parse(campaignData.target_audience);
          } catch (e) {
            console.error('Error parsing target_audience:', e);
            campaignData.target_audience = {};
          }
        }
        
        setCampaign(campaignData);
      } catch (err) {
        setError('Failed to load campaign details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        setLoading(true);
        
        // Delete campaign via API
        await adCampaignAPI.deleteCampaign(id);
        
        navigate('/campaigns');
      } catch (err) {
        setError('Failed to delete campaign. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/campaigns/edit/${id}`);
  };

  const handleAnalyticsTabChange = (event, newValue) => {
    setAnalyticsTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return 'default';
      case 'Scheduled':
        return 'info';
      case 'Active':
        return 'success';
      case 'Paused':
        return 'warning';
      case 'Completed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Check if campaign has been live for at least a week
  const isAnalyticsAvailable = () => {
    if (!campaign || !campaign.start_date) return false;
    const today = new Date();
    return campaign.status === 'Active' && differenceInDays(today, campaign.start_date) >= 7;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!campaign) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Campaign not found.
      </Alert>
    );
  }

  // Format the target audience for display
  const targetAudience = campaign.target_audience || {};
  const ageRange = targetAudience.age_min && targetAudience.age_max 
    ? `${targetAudience.age_min}-${targetAudience.age_max}` 
    : targetAudience.age_range || 'Not specified';
  
  const gender = targetAudience.gender || 'All';
  const location = targetAudience.location || 'Not specified';
  const interests = Array.isArray(targetAudience.interests) 
    ? targetAudience.interests.join(', ') 
    : targetAudience.interests || 'Not specified';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Campaign Details
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{campaign.title}</Typography>
              <Chip
                label={campaign.status}
                color={getStatusColor(campaign.status)}
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              {campaign.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Platform
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {campaign.platform}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Budget
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {typeof campaign.budget === 'number' ? `$${campaign.budget}` : campaign.budget}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {campaign.start_date && campaign.start_date instanceof Date && !isNaN(campaign.start_date) 
                    ? format(campaign.start_date, 'PPP') 
                    : 'Not set'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {campaign.end_date && campaign.end_date instanceof Date && !isNaN(campaign.end_date) 
                    ? format(campaign.end_date, 'PPP') 
                    : 'Not set'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Analytics Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Campaign Analytics
                <Tooltip title="Real-time performance metrics for your campaign">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <IconButton>
                <RefreshIcon />
              </IconButton>
            </Box>
            
            {!isAnalyticsAvailable() ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Analytics will be available when your ads have been live for at least one week.
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This ensures we can collect enough data to provide meaningful insights.
                </Typography>
                <LinearProgress sx={{ height: 10, borderRadius: 5 }} />
              </Box>
            ) : (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={analyticsTab} onChange={handleAnalyticsTabChange} aria-label="analytics tabs">
                    <Tab icon={<BarChartIcon />} label="Impressions" />
                    <Tab icon={<TimelineIcon />} label="Clicks" />
                    <Tab icon={<PieChartIcon />} label="Conversions" />
                  </Tabs>
                </Box>
                
                {analyticsTab === 0 && (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={impressionsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="value" name="Impressions" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                {analyticsTab === 1 && (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={clicksData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" name="Clicks" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                {analyticsTab === 2 && (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={conversionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name}) => name}
                        >
                          {conversionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {format(new Date(), 'PPP p')}
                  </Typography>
                  <Button variant="text" size="small">
                    Export Data
                  </Button>
                </Box>
              </>
            )}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Target Audience
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Age Range
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ageRange}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {gender}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Interests
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {interests}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {location}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {campaign.image_url ? (
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={campaign.image_url}
                alt={campaign.title}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Campaign Image
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No image available
              </Typography>
            </Paper>
          )}
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Campaign Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">
                {campaign.created_at && campaign.created_at instanceof Date && !isNaN(campaign.created_at) 
                  ? format(campaign.created_at, 'PPP') 
                  : 'Unknown'}
              </Typography>
            </Box>
            
            {campaign.updated_at && campaign.updated_at instanceof Date && !isNaN(campaign.updated_at) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {format(campaign.updated_at, 'PPP')}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate(`/calendar?campaign=${campaign.id}`)}
            >
              View in Calendar
            </Button>
          </Paper>
          
          {/* Campaign Performance Summary Card */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            
            {!isAnalyticsAvailable() ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Performance data will be available after one week.
              </Alert>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Impressions
                    </Typography>
                    <Typography variant="subtitle2">
                      0
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={0} sx={{ mt: 1, height: 6, borderRadius: 3 }} />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Click-through Rate
                    </Typography>
                    <Typography variant="subtitle2">
                      0%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={0} sx={{ mt: 1, height: 6, borderRadius: 3 }} color="success" />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Conversion Rate
                    </Typography>
                    <Typography variant="subtitle2">
                      0%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={0} sx={{ mt: 1, height: 6, borderRadius: 3 }} color="secondary" />
                </Box>
              </>
            )}
            
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={!isAnalyticsAvailable()}
            >
              View Detailed Report
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdCampaignDetail; 