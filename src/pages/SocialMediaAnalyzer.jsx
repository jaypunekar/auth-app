import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Avatar, 
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Link,
  Chip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Instagram, 
  People, 
  PhotoLibrary, 
  Verified, 
  Business, 
  Link as LinkIcon,
  Facebook,
  Public,
  Group,
  TrendingUp,
  Phone,
  Email
} from '@mui/icons-material';
import axios from 'axios';

// Tab Panel component for switching between social platforms
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-tabpanel-${index}`}
      aria-labelledby={`social-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SocialMediaAnalyzer = () => {
  const [tabValue, setTabValue] = useState(0);
  const [instagramUsername, setInstagramUsername] = useState('');
  const [facebookPageUrl, setFacebookPageUrl] = useState('');
  const [instagramData, setInstagramData] = useState(null);
  const [facebookData, setFacebookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleInstagramAnalyze = async () => {
    if (!instagramUsername) {
      setError('Please enter an Instagram username');
      return;
    }

    setLoading(true);
    setError('');
    setInstagramData(null);

    try {
      const response = await axios.post('/api/social-media/instagram-analysis', null, {
        params: {
          username: instagramUsername
        }
      });

      console.log("Instagram API Response:", response.data);
      
      if (response.data.success) {
        setInstagramData(response.data);
      } else {
        setError('Failed to retrieve Instagram data. Please try again.');
      }
    } catch (err) {
      console.error('Error analyzing Instagram profile:', err);
      setError(err.response?.data?.detail || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookAnalyze = async () => {
    if (!facebookPageUrl) {
      setError('Please enter a Facebook page URL');
      return;
    }

    setLoading(true);
    setError('');
    setFacebookData(null);

    try {
      const response = await axios.post('/api/social-media/facebook-analysis', null, {
        params: {
          page_url: facebookPageUrl
        }
      });

      console.log("Facebook API Response:", response.data);
      
      if (response.data.success) {
        setFacebookData(response.data);
      } else {
        setError('Failed to retrieve Facebook data. Please try again.');
      }
    } catch (err) {
      console.error('Error analyzing Facebook page:', err);
      setError(err.response?.data?.detail || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Custom circular progress component to visualize stats
  const CircularProgressWithLabel = ({ value, color, size = 120, thickness = 8, label }) => {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={size}
            thickness={thickness}
            sx={{ color: '#e0e0e0', position: 'absolute' }}
          />
          <CircularProgress
            variant="determinate"
            value={value > 100 ? 100 : value}
            size={size}
            thickness={thickness}
            sx={{ color }}
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
            <Typography variant="h6" component="div" color="text.secondary">
              {value}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ mt: 1 }}>{label}</Typography>
      </Box>
    );
  };

  const renderInstagramData = () => {
    if (!instagramData) return null;

    // Get the data from the correct nested structure
    const data = instagramData.data;
    
    if (!data) {
      return <Alert severity="warning">No profile data available for this username.</Alert>;
    }

    // Calculate engagement metrics
    const followRatio = data.following_count > 0 
      ? (data.follower_count / data.following_count) 
      : 0;
      
    // Simplistic engagement rate calculation
    const engagementRate = data.follower_count > 0 
      ? ((data.media_count / data.follower_count) * 100)
      : 0;
    
    // Calculate influence score (simplified formula)
    const influenceScore = Math.min(
      ((data.follower_count / 1000) * 0.5 + (data.is_verified ? 20 : 0) + 
      (data.is_business ? 10 : 0)), 100);

    return (
      <Box sx={{ mt: 4 }}>
        {/* Profile Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={data.profile_pic_url}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">{data.full_name}</Typography>
                {data.is_verified && (
                  <Verified color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>@{data.username}</Typography>
              
              {data.is_business && (
                <Chip 
                  icon={<Business />} 
                  label={data.category || "Business Account"} 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mb: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                {data.biography || 'No biography available'}
              </Typography>
              
              {data.external_url && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LinkIcon color="primary" sx={{ mr: 1 }} />
                  <Link href={data.external_url} target="_blank" rel="noopener noreferrer">
                    {data.external_url}
                  </Link>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <People color="primary" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {data.follower_count ? data.follower_count.toLocaleString() : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Followers</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <People color="secondary" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {data.following_count ? data.following_count.toLocaleString() : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Following</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <PhotoLibrary color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {data.media_count ? data.media_count.toLocaleString() : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Posts</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Key Metrics */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Instagram Profile Analytics
        </Typography>

        <Grid container spacing={4}>
          {/* Circular Progress Metrics */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <CircularProgressWithLabel 
                    value={Math.min(followRatio * 10, 100)} 
                    color="#E1306C" 
                    label="Follower Ratio" 
                  />
                </Grid>
                <Grid item>
                  <CircularProgressWithLabel 
                    value={Math.min(influenceScore, 100)} 
                    color="#405DE6" 
                    label="Influence Score" 
                  />
                </Grid>
                <Grid item>
                  <CircularProgressWithLabel 
                    value={Math.min(engagementRate, 100)} 
                    color="#FCAF45" 
                    label="Engagement" 
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom align="center">
                Performance Metrics
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" gutterBottom>Follower to Following Ratio</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" value={Math.min(followRatio * 10, 100)} color="primary" sx={{ height: 10, borderRadius: 5 }} />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{followRatio.toFixed(2)}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Higher is better. Ratio of followers to accounts following.
                </Typography>
              </Box>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" gutterBottom>Content Production Rate</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((data.media_count / 500) * 100, 100)} 
                      color="secondary" 
                      sx={{ height: 10, borderRadius: 5 }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{data.media_count}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Total content produced on the platform.
                </Typography>
              </Box>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" gutterBottom>Audience Size</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((data.follower_count / 1000000) * 100, 100)} 
                      sx={{ height: 10, borderRadius: 5, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: '#FCAF45' } }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                      {data.follower_count > 1000000 
                        ? `${(data.follower_count / 1000000).toFixed(1)}M` 
                        : data.follower_count > 1000 
                          ? `${(data.follower_count / 1000).toFixed(1)}K` 
                          : data.follower_count}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Size of audience relative to influencer status.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Additional Profile Insights */}
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Account Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Account Type</Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {data.is_business ? 'Business Account' : (data.is_professional_account ? 'Professional Account' : 'Personal Account')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Verification Status</Typography>
                  <Typography variant="h6" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                    {data.is_verified ? 
                      <>Verified <Verified color="primary" sx={{ ml: 1 }} /></> : 
                      'Not Verified'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Privacy Setting</Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {data.is_private ? 'Private Account' : 'Public Account'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {data.category && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Category:</Typography>
              <Chip 
                label={data.category} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  const renderFacebookData = () => {
    if (!facebookData) return null;

    // Get the data from the correct nested structure
    const data = facebookData.data;
    
    if (!data) {
      return <Alert severity="warning">No profile data available for this Facebook page.</Alert>;
    }

    // Calculate engagement metrics (using available Facebook metrics)
    const likesCount = data.likes || 0;
    const followerCount = data.followers || 0;
    const totalCount = data.talking_about_count || 0;
    
    // Engagement rate calculation (simplified for Facebook)
    const engagementRate = followerCount > 0 
      ? ((totalCount / followerCount) * 100)
      : 0;
    
    // Popularity score (simplified)
    const popularityScore = Math.min(
      ((followerCount / 1000) * 0.5 + (data.verified ? 20 : 0)), 100);

    return (
      <Box sx={{ mt: 4 }}>
        {/* Profile Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={data.profile_picture}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">{data.name}</Typography>
                {data.verified && (
                  <Verified color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>{data.username || data.name}</Typography>
              
              {data.category && (
                <Chip 
                  icon={<Business />} 
                  label={data.category} 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mb: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                {data.about || 'No description available'}
              </Typography>
              
              {data.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LinkIcon color="primary" sx={{ mr: 1 }} />
                  <Link href={data.website} target="_blank" rel="noopener noreferrer">
                    {data.website}
                  </Link>
                </Box>
              )}

              {data.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">{data.phone}</Typography>
                </Box>
              )}

              {data.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">{data.email}</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <People color="primary" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {followerCount ? followerCount.toLocaleString() : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Followers</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp color="secondary" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {likesCount ? likesCount.toLocaleString() : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Likes</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Group color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {totalCount ? totalCount.toLocaleString() : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Talking About</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Key Metrics */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Facebook Page Analytics
        </Typography>

        <Grid container spacing={4}>
          {/* Circular Progress Metrics */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <CircularProgressWithLabel 
                    value={Math.min(popularityScore, 100)} 
                    color="#3b5998" 
                    label="Popularity Score" 
                  />
                </Grid>
                <Grid item>
                  <CircularProgressWithLabel 
                    value={Math.min(engagementRate, 100)} 
                    color="#4267B2" 
                    label="Engagement" 
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom align="center">
                Performance Metrics
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" gutterBottom>Likes to Followers Ratio</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((likesCount / (followerCount || 1)) * 100, 100)} 
                      color="primary" 
                      sx={{ height: 10, borderRadius: 5 }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                      {followerCount ? (likesCount / followerCount).toFixed(2) : 0}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Higher is better. Ratio of likes to followers.
                </Typography>
              </Box>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" gutterBottom>Engagement Rate</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(engagementRate, 100)} 
                      color="secondary" 
                      sx={{ height: 10, borderRadius: 5 }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{engagementRate.toFixed(2)}%</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Percentage of followers actively engaged with the page.
                </Typography>
              </Box>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" gutterBottom>Audience Size</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((followerCount / 1000000) * 100, 100)} 
                      sx={{ height: 10, borderRadius: 5, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: '#4267B2' } }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                      {followerCount > 1000000 
                        ? `${(followerCount / 1000000).toFixed(1)}M` 
                        : followerCount > 1000 
                          ? `${(followerCount / 1000).toFixed(1)}K` 
                          : followerCount}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Size of audience relative to page prominence.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Additional Profile Insights */}
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Page Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Verification Status</Typography>
                  <Typography variant="h6" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                    {data.verified ? 
                      <>Verified <Verified color="primary" sx={{ ml: 1 }} /></> : 
                      'Not Verified'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Category</Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {data.category || 'Not Available'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Location</Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {data.location || 'Not Available'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Social Media Analyzer
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Analyze Instagram profiles and Facebook pages to get insights and metrics.
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="social media analyzer tabs"
        >
          <Tab icon={<Instagram />} label="Instagram" />
          <Tab icon={<Facebook />} label="Facebook" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <TextField
              label="Instagram Username"
              variant="outlined"
              fullWidth
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value)}
              placeholder="e.g. cristiano"
              error={tabValue === 0 && error !== ''}
              helperText={tabValue === 0 && error}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleInstagramAnalyze}
              disabled={loading || !instagramUsername}
              sx={{ height: 56 }}
            >
              {loading && tabValue === 0 ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
            </Button>
          </Box>
          {instagramData && renderInstagramData()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <TextField
              label="Facebook Page URL"
              variant="outlined"
              fullWidth
              value={facebookPageUrl}
              onChange={(e) => setFacebookPageUrl(e.target.value)}
              placeholder="e.g. https://www.facebook.com/fcbarcelona"
              error={tabValue === 1 && error !== ''}
              helperText={tabValue === 1 && error}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleFacebookAnalyze}
              disabled={loading || !facebookPageUrl}
              sx={{ height: 56 }}
            >
              {loading && tabValue === 1 ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
            </Button>
          </Box>
          {facebookData && renderFacebookData()}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SocialMediaAnalyzer; 