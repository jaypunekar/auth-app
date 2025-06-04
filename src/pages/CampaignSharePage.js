import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { API_BASE_URL } from '../config';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(3, 0),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

const CampaignSharePage = () => {
  const { shareId } = useParams();
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/campaign-share/${shareId}`);
        setCampaignData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching campaign data:', err);
        setError('This campaign could not be found or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchCampaignData();
    }
  }, [shareId]);

  // Handle email form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setSubmitError('Please enter your email address.');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const response = await axios.post(`${API_BASE_URL}/api/campaign-share/form/${shareId}`, {
        email,
      });
      
      if (response.data.success) {
        setSubmitSuccess(true);
        setEmail('');
      } else {
        setSubmitError('Failed to send campaign details. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting email:', err);
      setSubmitError('An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format budget as currency
  const formatBudget = (budget) => {
    if (!budget) return 'Not specified';
    return `$${parseFloat(budget).toFixed(2)}`;
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setSubmitSuccess(false);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading campaign details...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <StyledPaper>
          <Typography variant="h4" gutterBottom>
            Campaign Not Found
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1" sx={{ mt: 3 }}>
            The campaign you're looking for may have been removed or the link may be incorrect.
          </Typography>
        </StyledPaper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 8 }}>
      <Snackbar
        open={submitSuccess}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity="success" sx={{ width: '100%' }}>
          Campaign details have been sent to your email!
        </Alert>
      </Snackbar>

      {campaignData && (
        <>
          <StyledPaper>
            <Typography variant="h4" gutterBottom>
              {campaignData.title || 'Campaign Details'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {campaignData.description || 'No description provided'}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Campaign Overview
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Platform"
                          secondary={campaignData.platform || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Budget"
                          secondary={formatBudget(campaignData.budget)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Start Date"
                          secondary={campaignData.start_date || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="End Date"
                          secondary={campaignData.end_date || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Objective"
                          secondary={campaignData.objective || 'Not specified'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Target Audience
                    </Typography>
                    {campaignData.target_audience ? (
                      <List dense>
                        {Object.entries(campaignData.target_audience).map(([key, value]) => (
                          <ListItem key={key}>
                            <ListItemText
                              primary={key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              secondary={Array.isArray(value) ? value.join(', ') : value}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No target audience specified
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {campaignData.headlines && campaignData.headlines.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Headlines
                      </Typography>
                      <List dense>
                        {campaignData.headlines.map((headline, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={headline} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {campaignData.descriptions && campaignData.descriptions.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Descriptions
                      </Typography>
                      <List dense>
                        {campaignData.descriptions.map((description, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={description} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </StyledPaper>
          
          <StyledPaper>
            <Typography variant="h5" gutterBottom>
              Get Campaign Details via Email
            </Typography>
            <Typography variant="body1" paragraph>
              Enter your email address below to receive the full campaign details.
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    error={!!submitError}
                    helperText={submitError}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={submitting}
                    sx={{ height: '56px' }}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Send Details'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </StyledPaper>
        </>
      )}
    </Container>
  );
};

export default CampaignSharePage; 