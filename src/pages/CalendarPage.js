import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { calendarAPI, adCampaignAPI } from '../services/api';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchCalendarEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Log token status for debugging
        console.log('Calendar Page - Token check:', {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'No token'
        });

        if (!token) {
          console.log('No valid token found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        // Fetch calendar entries
        const response = await calendarAPI.getEntries();
        
        // Check if we got an unauthorized response
        if (response.error === 'Unauthorized') {
          console.log('Received unauthorized response, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }
        
        if (!response || !response.data) {
          throw new Error('Invalid response from calendar API');
        }
        
        console.log('Calendar entries fetched successfully:', {
          count: response.data.length,
          entries: response.data
        });
        
        setCalendarEntries(response.data);
      } catch (err) {
        console.error('Error fetching calendar entries:', err);
        
        // Only redirect to login if it's a 401 error
        if (err.response?.status === 401) {
          console.log('Received 401 error, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }
        
        setError('Failed to fetch calendar entries. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendarEntries();
  }, [currentDate, navigate]);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleOpenDialog = (entry = null) => {
    setSelectedEntry(entry);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntry(null);
  };

  const handleSaveEntry = async () => {
    if (!selectedEntry) return;
    
    try {
      setLoading(true);
      
      // Prepare the data to update
      const entryData = {
        ad_copy: selectedEntry.ad_copy,
        status: selectedEntry.status,
        scheduled_date: format(new Date(selectedEntry.scheduled_date), 'yyyy-MM-dd')
      };
      
      // Update the entry via API
      await calendarAPI.updateEntry(selectedEntry.id, entryData);
      
      // Update the local state
      setCalendarEntries(calendarEntries.map(entry => 
        entry.id === selectedEntry.id ? { ...entry, ...entryData, scheduled_date: new Date(entryData.scheduled_date) } : entry
      ));
      
      console.log('Successfully updated calendar entry:', selectedEntry.id);
      
      // Close the dialog
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save calendar entry. Please try again.');
      console.error('Error saving calendar entry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this calendar entry?')) {
      try {
        setLoading(true);
        
        // Delete the entry via API
        await calendarAPI.deleteEntry(entryId);
        
        // Update the UI
        setCalendarEntries(calendarEntries.filter(entry => entry.id !== entryId));
        
        console.log('Successfully deleted calendar entry:', entryId);
      } catch (err) {
        setError('Failed to delete calendar entry. Please try again.');
        console.error('Error deleting calendar entry:', err);
      } finally {
        setLoading(false);
      }
    }
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

  const getPhaseColor = (phase) => {
    if (phase.includes('AWARENESS')) {
      return '#2196f3'; // Blue
    } else if (phase.includes('CONSIDERATION')) {
      return '#ff9800'; // Orange
    } else if (phase.includes('CONVERSION')) {
      return '#4caf50'; // Green
    }
    return '#9e9e9e'; // Grey
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    console.log('Rendering calendar with entries:', calendarEntries);
    
    return (
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Grid container spacing={1}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs={12/7} key={day}>
              <Typography variant="subtitle2" align="center" fontWeight="bold">
                {day}
              </Typography>
            </Grid>
          ))}
          
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <Grid item xs={12/7} key={`empty-start-${index}`}>
              <Paper 
                sx={{ 
                  height: 220, 
                  bgcolor: 'background.default',
                  opacity: 0.5
                }}
              />
            </Grid>
          ))}
          
          {/* Calendar days */}
          {days.map((day) => {
            const dayEntries = calendarEntries.filter(
              entry => format(new Date(entry.scheduled_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );
            
            // Debug log for entries on this day
            if (dayEntries.length > 0) {
              console.log(`Entries for ${format(day, 'yyyy-MM-dd')}:`, dayEntries);
            }
            
            return (
              <Grid item xs={12/7} key={day.toString()}>
                <Paper
                  sx={{
                    p: 1,
                    minHeight: 220,
                    maxHeight: 350,
                    height: '100%',
                    bgcolor: isToday(day) ? 'primary.light' : 'background.paper',
                    color: isToday(day) ? 'primary.contrastText' : 'text.primary',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Day number */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: isToday(day) ? 'bold' : 'normal',
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    
                    {dayEntries.length > 0 && (
                      <Badge badgeContent={dayEntries.length} color="primary">
                        <CalendarIcon fontSize="small" />
                      </Badge>
                    )}
                  </Box>
                  
                  {/* Date display */}
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {format(day, 'EEEE, MMMM yyyy')}
                  </Typography>
                  
                  {/* Entries for this day */}
                  <Box sx={{ 
                    flex: 1, 
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    {dayEntries.length > 0 ? (
                      dayEntries.map(entry => (
                        <Card 
                          key={entry.id} 
                          sx={{ 
                            mb: 1, 
                            bgcolor: '#f5f5f5',
                            cursor: 'pointer',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s'
                            },
                            border: `2px solid ${getPhaseColor(entry.parsed_ad_copy.phase || '')}`,
                            position: 'relative',
                            minHeight: '80px',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onClick={() => handleOpenDialog(entry)}
                        >
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, flexGrow: 1 }}>
                            {/* Phase indicator */}
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bgcolor: getPhaseColor(entry.parsed_ad_copy.phase),
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                px: 1,
                                borderBottomLeftRadius: 4
                              }}
                            >
                              {entry.parsed_ad_copy.phase || 'PHASE'}
                            </Box>
                            
                            {/* TITLE */}
                            <Box sx={{ mt: 1.5, mb: 1 }}>
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="bold" 
                                sx={{ 
                                  color: 'text.primary',
                                  fontSize: '0.85rem',
                                  lineHeight: 1.2,
                                  display: 'block',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {entry.parsed_ad_copy.title}
                              </Typography>
                            </Box>
                            
                            {/* HEADLINE */}
                            <Box sx={{ mb: 1 }}>
                              <Typography 
                                variant="body2" 
                                color="primary.main" 
                                fontWeight="medium" 
                                sx={{ 
                                  fontSize: '0.9rem',
                                  lineHeight: 1.3,
                                  fontStyle: 'italic',
                                  display: 'block',
                                  wordBreak: 'break-word'
                                }}
                              >
                                "{entry.parsed_ad_copy.headline}"
                              </Typography>
                            </Box>
                            
                            {/* Campaign name */}
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                display: 'block',
                                mt: 0.5,
                                fontSize: '0.7rem'
                              }}
                            >
                              {entry.campaign.title}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No entries
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
          
          {/* Empty cells for days after the last day of the month */}
          {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
            <Grid item xs={12/7} key={`empty-end-${index}`}>
              <Paper 
                sx={{ 
                  height: 220, 
                  bgcolor: 'background.default',
                  opacity: 0.5
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Content Calendar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Entry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Debug Output */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Debug Info</Typography>
        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
          {calendarEntries.map(entry => (
            <Box key={entry.id} sx={{ mb: 2, p: 1, border: '1px solid #eee' }}>
              <Typography variant="subtitle2">Entry ID: {entry.id}</Typography>
              <Typography variant="body2">Date: {entry.scheduled_date ? format(new Date(entry.scheduled_date), 'yyyy-MM-dd') : 'MISSING'}</Typography>
              <Typography variant="body2">Title: {entry.parsed_ad_copy.title || 'MISSING'}</Typography>
              <Typography variant="body2">Headline: {entry.parsed_ad_copy.headline || 'MISSING'}</Typography>
              <Typography variant="body2">Phase: {entry.parsed_ad_copy.phase || 'MISSING'}</Typography>
              <Typography variant="body2">Raw Ad Copy: {entry.ad_copy ? entry.ad_copy.substring(0, 100) + '...' : 'MISSING'}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={handlePreviousMonth}
          >
            Previous
          </Button>
          <Typography variant="h5">
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Button 
            variant="outlined" 
            endIcon={<ArrowForwardIcon />} 
            onClick={handleNextMonth}
          >
            Next
          </Button>
        </Box>
        
        {/* Phase Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, bgcolor: getPhaseColor('AWARENESS'), mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Awareness</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, bgcolor: getPhaseColor('CONSIDERATION'), mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Consideration</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, bgcolor: getPhaseColor('CONVERSION'), mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Conversion</Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderCalendar()
        )}
      </Paper>

      {/* Entry Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEntry ? 'Campaign Details' : 'Add Calendar Entry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedEntry ? (
              (() => {
                try {
                  // Try to parse the ad_copy as JSON
                  const adCopyObj = JSON.parse(selectedEntry.ad_copy);
                  
                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" color="primary.main">
                          {adCopyObj.phase || selectedEntry.campaign.title}
                        </Typography>
                        <Chip
                          label={selectedEntry.status}
                          color={getStatusColor(selectedEntry.status)}
                          variant="outlined"
                        />
                      </Box>
                      
                      {adCopyObj.date_range && (
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Duration: {adCopyObj.date_range}
                        </Typography>
                      )}
                      
                      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                        {adCopyObj.title && (
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            {adCopyObj.title}
                          </Typography>
                        )}
                        
                        {adCopyObj.headline && adCopyObj.headline !== adCopyObj.title && (
                          <Typography variant="h5" gutterBottom color="primary.main" sx={{ mt: 2 }}>
                            {adCopyObj.headline}
                          </Typography>
                        )}
                        
                        {adCopyObj.description && (
                          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                            {adCopyObj.description}
                          </Typography>
                        )}
                        
                        {adCopyObj.cta && (
                          <Button variant="contained" color="primary" sx={{ mt: 1 }}>
                            {adCopyObj.cta}
                          </Button>
                        )}
                      </Paper>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Campaign Details
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Campaign
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.campaign.title || 'Unknown Campaign'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Platform
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.campaign.platform || 'Unknown Platform'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Scheduled Date
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.scheduled_date ? format(new Date(selectedEntry.scheduled_date), 'PPP') : 'Not scheduled'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Budget Information
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Daily Budget
                              </Typography>
                              <Typography variant="h6" color="primary.main">
                                ${selectedEntry.campaign.budget || '10.00'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Budget Type
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.campaign.budget_type || 'Daily'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Estimated Monthly Spend
                              </Typography>
                              <Typography variant="body1">
                                ${selectedEntry.campaign.budget ? (parseFloat(selectedEntry.campaign.budget) * 30).toFixed(2) : '300.00'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Raw Ad Copy
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          value={selectedEntry.ad_copy}
                          onChange={(e) => setSelectedEntry({ ...selectedEntry, ad_copy: e.target.value })}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </>
                  );
                } catch (err) {
                  // Fallback to parsed data
                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" color="primary.main">
                          {selectedEntry.parsed_ad_copy.phase || selectedEntry.campaign.title}
                        </Typography>
                        <Chip
                          label={selectedEntry.status}
                          color={getStatusColor(selectedEntry.status)}
                          variant="outlined"
                        />
                      </Box>
                      
                      {selectedEntry.parsed_ad_copy.date_range && (
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Duration: {selectedEntry.parsed_ad_copy.date_range}
                        </Typography>
                      )}
                      
                      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                        {selectedEntry.parsed_ad_copy.title && (
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            {selectedEntry.parsed_ad_copy.title}
                          </Typography>
                        )}
                        
                        {selectedEntry.parsed_ad_copy.headline && selectedEntry.parsed_ad_copy.headline !== selectedEntry.parsed_ad_copy.title && (
                          <Typography variant="h5" gutterBottom color="primary.main" sx={{ mt: 2 }}>
                            {selectedEntry.parsed_ad_copy.headline}
                          </Typography>
                        )}
                        
                        {selectedEntry.parsed_ad_copy.description && (
                          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                            {selectedEntry.parsed_ad_copy.description}
                          </Typography>
                        )}
                        
                        {selectedEntry.parsed_ad_copy.cta && (
                          <Button variant="contained" color="primary" sx={{ mt: 1 }}>
                            {selectedEntry.parsed_ad_copy.cta}
                          </Button>
                        )}
                      </Paper>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Campaign Details
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Campaign
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.campaign.title || 'Unknown Campaign'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Platform
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.campaign.platform || 'Unknown Platform'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Scheduled Date
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.scheduled_date ? format(new Date(selectedEntry.scheduled_date), 'PPP') : 'Not scheduled'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Budget Information
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Daily Budget
                              </Typography>
                              <Typography variant="h6" color="primary.main">
                                ${selectedEntry.campaign.budget || '10.00'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Budget Type
                              </Typography>
                              <Typography variant="body1">
                                {selectedEntry.campaign.budget_type || 'Daily'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Estimated Monthly Spend
                              </Typography>
                              <Typography variant="body1">
                                ${selectedEntry.campaign.budget ? (parseFloat(selectedEntry.campaign.budget) * 30).toFixed(2) : '300.00'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Raw Ad Copy
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          value={selectedEntry.ad_copy}
                          onChange={(e) => setSelectedEntry({ ...selectedEntry, ad_copy: e.target.value })}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </>
                  );
                }
              })()
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Ad Copy"
                  multiline
                  rows={4}
                  value=""
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Status"
                  value="Draft"
                  sx={{ mb: 2 }}
                  disabled
                />
                
                <TextField
                  fullWidth
                  label="Campaign"
                  value=""
                  sx={{ mb: 2 }}
                  disabled
                />
                
                <TextField
                  fullWidth
                  label="Scheduled Date"
                  type="date"
                  value={format(new Date(), 'yyyy-MM-dd')}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button onClick={handleSaveEntry} variant="contained" disabled={!selectedEntry}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage; 