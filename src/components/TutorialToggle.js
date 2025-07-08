import React, { useState } from 'react';
import { Button, Typography, Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { authAPI } from '../services/api';

const TutorialToggle = ({ initialStatus = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(initialStatus);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const toggleTutorialStatus = async () => {
    setIsLoading(true);
    try {
      // Use the API service method instead of direct axios call
      const response = await authAPI.updateTutorialStatus(!tutorialCompleted);

      // Update local state based on server response
      setTutorialCompleted(response.data.has_completed_tutorial);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Tutorial status set to ${response.data.has_completed_tutorial ? 'completed' : 'not completed'}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating tutorial status:', error);
      
      // Show error message
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.detail || 'Failed to update tutorial status'}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h6">
        Tutorial Status: {tutorialCompleted ? 'Completed' : 'Not Completed'}
      </Typography>
      
      <Button
        variant="contained"
        color={tutorialCompleted ? "warning" : "success"}
        onClick={toggleTutorialStatus}
        disabled={isLoading}
        sx={{ minWidth: '200px' }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          tutorialCompleted ? 'Mark as Not Completed' : 'Mark as Completed'
        )}
      </Button>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TutorialToggle; 