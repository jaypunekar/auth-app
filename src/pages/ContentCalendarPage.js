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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import businessProfileService from '../services/businessProfileService';

const ContentCalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);

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
      } catch (err) {
        console.error('Error fetching content calendar data:', err);
        setError('Failed to fetch content calendar. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate]);

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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Content Calendar
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={downloadCalendarCSV}
          disabled={!calendarEntries || calendarEntries.length === 0}
        >
          Export to CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
    </Box>
  );
};

export default ContentCalendarPage; 