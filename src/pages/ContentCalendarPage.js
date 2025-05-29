import React, { useState, useEffect } from 'react';
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
  Divider,
  Tooltip,
  Tabs,
  Tab,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  BookmarkBorder as BookmarkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import businessProfileService from '../services/businessProfileService';

const ContentCalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [savedCalendarEntries, setSavedCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialog, setEditDialog] = useState({ open: false, entry: null });

  useEffect(() => {
    // Fetch business profile and calendar entries
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch business profile
        const profileData = await businessProfileService.getProfile();
        setBusinessProfile(profileData);
        
        // Fetch content calendar data
        const calendarData = await businessProfileService.getContentCalendar();
        console.log("Calendar data:", calendarData);
        
        // Transform data if needed - handle both old and new format
        let processedEntries = calendarData;
        
        // Check if we got the new format with arrays of headlines and descriptions
        if (calendarData && calendarData.length > 0 && 
            (calendarData[0].headlines || calendarData[0].descriptions)) {
          // Convert to flat entries with one headline/description per entry
          processedEntries = [];
          calendarData.forEach(day => {
            // Get the date
            const date = day.date;
            
            // Make sure headlines and descriptions are arrays
            const headlines = Array.isArray(day.headlines) ? day.headlines : [day.headline || ''];
            const descriptions = Array.isArray(day.descriptions) ? day.descriptions : [day.description || ''];
            
            // For each headline, create an entry
            headlines.forEach((headline, index) => {
              // Cycle through descriptions if we have more headlines than descriptions
              const description = descriptions[index % descriptions.length] || '';
              processedEntries.push({
                date,
                headline,
                description
              });
            });
          });
          console.log("Processed entries:", processedEntries);
        }
        
        setCalendarEntries(processedEntries);
        
        // Also load saved entries
        await loadSavedEntries();
      } catch (err) {
        console.error('Error fetching content calendar data:', err);
        setError('Failed to fetch content calendar. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate]);

  const loadSavedEntries = async () => {
    try {
      const saved = await businessProfileService.getSavedContentCalendarEntries();
      setSavedCalendarEntries(saved);
    } catch (error) {
      console.error('Failed to load saved calendar entries:', error);
    }
  };

  const saveCurrentCalendar = async () => {
    setLoading(true);
    try {
      await businessProfileService.saveCurrentContentCalendar();
      await loadSavedEntries(); // Refresh saved entries
      setSnackbar({
        open: true,
        message: 'Content calendar saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save calendar:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save calendar. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry) => {
    setEditDialog({ open: true, entry: { ...entry } });
  };

  const handleSaveEdit = async () => {
    const { entry } = editDialog;
    if (!entry) return;

    try {
      await businessProfileService.updateContentCalendarEntry(entry.id, {
        date: entry.date,
        headline: entry.headline,
        description: entry.description
      });
      await loadSavedEntries();
      setEditDialog({ open: false, entry: null });
      setSnackbar({
        open: true,
        message: 'Entry updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update entry:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update entry. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await businessProfileService.deleteContentCalendarEntry(entryId);
      await loadSavedEntries();
      setSnackbar({
        open: true,
        message: 'Entry deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete entry:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete entry. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  const downloadCalendarCSV = () => {
    if (!calendarEntries || calendarEntries.length === 0) return;
    
    // Group entries by date to handle multiple headlines per day
    const entriesByDate = {};
    calendarEntries.forEach(entry => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = {
          date: entry.date,
          headlines: [],
          descriptions: []
        };
      }
      
      // Add headline and description if not already in the arrays
      if (!entriesByDate[entry.date].headlines.includes(entry.headline)) {
        entriesByDate[entry.date].headlines.push(entry.headline);
      }
      if (!entriesByDate[entry.date].descriptions.includes(entry.description)) {
        entriesByDate[entry.date].descriptions.push(entry.description);
      }
    });
    
    // Create CSV content
    const csvHeader = 'Date,Headlines,Descriptions\n';
    const csvRows = Object.values(entriesByDate).map(dayData => {
      const headlines = dayData.headlines.map(h => h.replace(/"/g, '""')).join(' | ');
      const descriptions = dayData.descriptions.map(d => d.replace(/"/g, '""')).join(' | ');
      return `${dayData.date},"${headlines}","${descriptions}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set download attributes
    link.setAttribute('href', url);
    link.setAttribute('download', `content_calendar_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Filter entries for the current month
    const currentMonthEntries = calendarEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isSameMonth(entryDate, currentDate);
    });
    
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
            const formattedDay = format(day, 'yyyy-MM-dd');
            // Get all entries for this day (might be multiple headlines now)
            const dayEntries = currentMonthEntries.filter(entry => entry.date === formattedDay);
            // Use the first entry for display or undefined if no entries
            const dayEntry = dayEntries.length > 0 ? dayEntries[0] : undefined;
            
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
                      <Tooltip title={`${dayEntries.length} headline(s) available`}>
                        <Box display="flex" alignItems="center">
                          <Typography variant="caption" sx={{ mr: 0.5 }}>
                            {dayEntries.length}
                          </Typography>
                          <CalendarIcon fontSize="small" color="primary" />
                        </Box>
                      </Tooltip>
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
                  
                  {/* Content for this day */}
                  <Box sx={{ 
                    flex: 1, 
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    {dayEntries.length > 0 ? (
                      dayEntries.slice(0, 1).map((entry, index) => (
                        <Card 
                          key={`${entry.date}-${index}`} 
                          sx={{ 
                            mb: 1, 
                            bgcolor: '#f5f5f5',
                            border: '2px solid #4caf50',
                            position: 'relative',
                            minHeight: '80px',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, flexGrow: 1 }}>
                            {/* Show content count if multiple headlines */}
                            {dayEntries.length > 1 && (
                              <Box sx={{ mb: 1 }}>
                                <Chip 
                                  size="small" 
                                  color="secondary" 
                                  label={`${dayEntries.length} headlines`} 
                                />
                              </Box>
                            )}
                          
                            {/* Headline */}
                            <Box sx={{ mt: 0.5, mb: 1 }}>
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="bold" 
                                sx={{ 
                                  color: 'primary.main',
                                  fontSize: '0.85rem',
                                  lineHeight: 1.2,
                                  display: 'block',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {entry.headline}
                              </Typography>
                            </Box>
                            
                            {/* Description */}
                            <Box sx={{ mb: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  lineHeight: 1.3,
                                  display: 'block',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {entry.description}
                              </Typography>
                            </Box>
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
                          No content
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

  const renderSavedEntries = () => {
    if (savedCalendarEntries.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            No saved content calendar entries yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate a calendar and save it to see entries here.
          </Typography>
        </Box>
      );
    }

    // Group entries by date
    const entriesByDate = {};
    savedCalendarEntries.forEach(entry => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = [];
      }
      entriesByDate[entry.date].push(entry);
    });

    return (
      <Box>
        {Object.entries(entriesByDate)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([date, entries]) => (
            <Paper key={date} sx={{ mb: 2, p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" />
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <List dense>
                {entries.map((entry) => (
                  <ListItem key={entry.id} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.headline}
                      secondary={entry.description}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditEntry(entry)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteEntry(entry.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          ))
        }
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Content Calendar
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {tabValue === 0 && calendarEntries.length > 0 && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveCurrentCalendar}
              disabled={loading}
            >
              Save Calendar
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadCalendarCSV}
            disabled={!calendarEntries || calendarEntries.length === 0}
          >
            Export to CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" />
              Current Calendar
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkIcon fontSize="small" />
              Saved Entries ({savedCalendarEntries.length})
            </Box>
          } 
        />
      </Tabs>

      {/* Current Calendar Tab */}
      {tabValue === 0 && (
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

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : calendarEntries.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                No content calendar has been generated yet.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/business-profile')}
                sx={{ mt: 2 }}
              >
                Generate Calendar
              </Button>
            </Box>
          ) : (
            renderCalendar()
          )}
        </Paper>
      )}

      {/* Saved Entries Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Your Saved Content Calendar Entries
          </Typography>
          {renderSavedEntries()}
        </Paper>
      )}

      {/* Business Profile Info Card */}
      {businessProfile && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated for: {businessProfile.business_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Industry: {businessProfile.industry}
          </Typography>
          {businessProfile.products && (
            <Typography variant="body2" color="text.secondary">
              Products: {businessProfile.products}
            </Typography>
          )}
          {businessProfile.services && (
            <Typography variant="body2" color="text.secondary">
              Services: {businessProfile.services}
            </Typography>
          )}
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, entry: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Content Calendar Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={editDialog.entry?.date || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              entry: { ...editDialog.entry, date: e.target.value }
            })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Headline"
            value={editDialog.entry?.headline || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              entry: { ...editDialog.entry, headline: e.target.value }
            })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editDialog.entry?.description || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              entry: { ...editDialog.entry, description: e.target.value }
            })}
            margin="normal"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, entry: null })}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentCalendarPage; 