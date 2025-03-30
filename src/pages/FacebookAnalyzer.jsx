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
  LinearProgress
} from '@mui/material';
import { 
  Facebook, 
  People, 
  Verified, 
  Business, 
  Link as LinkIcon,
  Public,
  Group,
  TrendingUp,
  Phone,
  Email
} from '@mui/icons-material';
import axios from 'axios';

const FacebookAnalyzer = () => {
  const [pageUrl, setPageUrl] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!pageUrl) {
      setError('Please enter a Facebook page URL or username');
      return;
    }

    setLoading(true);
    setError('');
    setProfileData(null);

    // Format the URL - add facebook domain prefix if just a username is entered
    const formattedUrl = pageUrl.includes('facebook.com') || pageUrl.includes('fb.com') 
      ? pageUrl 
      : `https://www.facebook.com/${pageUrl.trim()}`;

    try {
      // Use GET request for data retrieval with query parameters
      const response = await axios.get(`/api/social-media/facebook-analysis?page_url=${encodeURIComponent(formattedUrl)}`);

      console.log("Facebook API Response:", response.data);
      
      if (response.data.success) {
        setProfileData(response.data);
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

  const renderProfileData = () => {
    if (!profileData) return null;

    // Get the data from the correct nested structure - Facebook API returns an array
    const data = Array.isArray(profileData.data) ? profileData.data[0] : profileData.data;
    
    if (!data) {
      return <Alert severity="warning">No profile data available for this Facebook page.</Alert>;
    }

    // Calculate engagement metrics (using available Facebook metrics)
    const likesCount = data.likes_count || 0;
    const followerCount = data.followers_count || 0;
    const totalCount = parseInt(data.description?.match(/([0-9,]+) talking about this/)?.[1]?.replace(/,/g, '') || 0, 10);
    
    // Engagement rate calculation (simplified for Facebook)
    const engagementRate = followerCount > 0 
      ? ((totalCount / followerCount) * 100)
      : 0;
    
    // Popularity score (simplified)
    const popularityScore = Math.min(
      ((followerCount / 1000) * 0.5 + (data.confirmed_owner_label ? 20 : 0)), 100);

    return (
      <Box sx={{ mt: 4 }}>
        {/* Profile Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={data.image}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">{data.title}</Typography>
                {data.confirmed_owner_label && (
                  <Verified color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>{data.url && new URL(data.url).pathname.replace('/', '')}</Typography>
              
              {data.category && Array.isArray(data.category) && data.category.length > 0 && (
                <Chip 
                  icon={<Business />} 
                  label={data.category[1] || data.category[0]} 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mb: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                {data.description || data.about_me_text || 'No description available'}
              </Typography>
              
              {data.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LinkIcon color="primary" sx={{ mr: 1 }} />
                  <Link href={data.website.startsWith('http') ? data.website : `https://${data.website}`} target="_blank" rel="noopener noreferrer">
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
                    {data.confirmed_owner_label ? 
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
                    {Array.isArray(data.category) && data.category.length > 0 ? data.category.join(', ') : 'Not Available'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Status</Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Not Available'}
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
        <Facebook color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
        Facebook Page Analyzer
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Analyze Facebook pages to get insights and metrics about engagement, reach, and audience.
      </Typography>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <TextField
            label="Facebook Page URL or Username"
            variant="outlined"
            fullWidth
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="e.g. fcbarcelona or https://www.facebook.com/fcbarcelona"
            error={error !== ''}
            helperText={error}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAnalyze}
            disabled={loading || !pageUrl}
            sx={{ height: 56 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
          </Button>
        </Box>
        {profileData && renderProfileData()}
      </Paper>
    </Box>
  );
};

export default FacebookAnalyzer; 