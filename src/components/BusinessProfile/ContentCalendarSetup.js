import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  TextField,
  Alert,
  Grid
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import businessProfileService from '../../services/businessProfileService';

const ContentCalendarSetup = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7)) // Default to one week
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validate dates
    if (startDate >= endDate) {
      setError('End date must be after start date');
      return;
    }
    
    // Calculate the date range difference in days
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Limit calendar generation to a reasonable range (e.g., 30 days)
    if (diffDays > 30) {
      setError('Please select a date range of 30 days or less');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Format dates for API
      const dateRange = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      };
      
      // Call API to generate calendar
      await businessProfileService.generateContentCalendar(dateRange);
      
      // Navigate to the calendar page to show results
      navigate('/content-calendar');
    } catch (error) {
      console.error('Failed to generate content calendar:', error);
      setError(error.response?.data?.detail || 'Failed to generate content calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mt: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CalendarMonthIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" component="h2">
          Content Calendar Generator
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate a custom content calendar with AI-powered headlines and descriptions for each day based on your business profile.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDate={startDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
            />
          </Grid>
        </Grid>
      </LocalizationProvider>
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <DateRangeIcon />}
        sx={{ mt: 1 }}
      >
        {loading ? 'Generating Calendar...' : 'Generate Content Calendar'}
      </Button>
    </Paper>
  );
};

export default ContentCalendarSetup; 