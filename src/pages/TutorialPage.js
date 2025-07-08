import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import TutorialToggle from '../components/TutorialToggle';
import { authAPI } from '../services/api';

const TutorialPage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getUser();
        
        setUserData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.response?.data?.detail || 'Failed to fetch user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tutorial Status Management
        </Typography>
        
        {loading ? (
          <Typography>Loading user data...</Typography>
        ) : error ? (
          <Typography color="error">Error: {error}</Typography>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1">
                Welcome, {userData.first_name || userData.email}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Here you can manage your tutorial completion status
              </Typography>
            </Box>
            
            <TutorialToggle initialStatus={userData.has_completed_tutorial} />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default TutorialPage; 