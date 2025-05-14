import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Divider,
  Chip,
  useTheme,
  Drawer,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import businessProfileService from '../../services/businessProfileService';
import BusinessProfileForm from './BusinessProfileForm';
import BlogSuggestions from './BlogSuggestions';

const BusinessProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const theme = useTheme();

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await businessProfileService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching business profile:', err);
      setError('Failed to load business profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdated = (updatedProfile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const renderProfileView = () => {
    if (isLoading) {
      return (
        <Stack spacing={2}>
          <Skeleton variant="text" height={40} width="60%" />
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={100} />
        </Stack>
      );
    }

    if (error) {
      return <Typography color="error">{error}</Typography>;
    }

    if (!profile) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            You haven't created a business profile yet.
          </Typography>
          <BusinessProfileForm onProfileUpdated={handleProfileUpdated} />
        </Box>
      );
    }

    return (
      <>
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h2">
              {profile.business_name}
            </Typography>
            <Tooltip title="Edit Profile">
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                aria-label="edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Chip 
            label={profile.industry} 
            color="primary" 
            size="small" 
            sx={{ mb: 2 }} 
          />
          
            {profile.report_frequency_hours && (
            <Chip 
                label={`Reports every ${profile.report_frequency_hours} ${profile.report_frequency_hours === 1 ? 'hour' : 'hours'}`}
              color="secondary"
              size="small"
              sx={{ mb: 2, ml: 1 }}
            />
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Stack spacing={2}>
            {profile.website_url && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Website:</Typography>
                <Typography variant="body2">
                  <a href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: theme.palette.primary.main }}
                  >
                    {profile.website_url}
                  </a>
                </Typography>
              </Box>
            )}
            
            {profile.products && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Products:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {profile.products}
                </Typography>
              </Box>
            )}
            
            {profile.services && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Services:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {profile.services}
                </Typography>
              </Box>
            )}
            
              {profile.report_frequency_hours && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Ad Performance Report Frequency:</Typography>
                <Typography variant="body2">
                    Every {profile.report_frequency_hours} {profile.report_frequency_hours === 1 ? 'hour' : 'hours'}
                </Typography>
              </Box>
            )}
            
              {!profile.website_url && !profile.products && !profile.services && !profile.report_frequency_hours && (
              <Typography variant="body2" fontStyle="italic">
                No business information provided.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

        {/* AI Blog Suggestions Component */}
        <BlogSuggestions />
      </>
    );
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Business Profile
      </Typography>
      
      {renderProfileView()}

      {/* Edit Profile Drawer */}
      <Drawer
        anchor="right"
        open={isEditing}
        onClose={() => setIsEditing(false)}
      >
        <Box sx={{ width: 450, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6">Edit Business Profile</Typography>
            <IconButton 
              onClick={() => setIsEditing(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <BusinessProfileForm existingProfile={profile} onProfileUpdated={handleProfileUpdated} />
        </Box>
      </Drawer>
    </Box>
  );
};

export default BusinessProfilePage; 