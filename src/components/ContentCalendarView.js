import React, { useState, useEffect, useCallback } from 'react';
import { chatAPI } from '../services/api'; // Adjusted path
import { List, ListItem, ListItemText, Typography, Paper, CircularProgress, Alert, Grid, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';
import TitleIcon from '@mui/icons-material/Title';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const DayEntry = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderLeft: `5px solid ${theme.palette.primary.main}`,
}));

const ContentCalendarView = () => {
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatAPI.getContentCalendar();
      if (response.data && Array.isArray(response.data)) {
        // Group entries by date
        const groupedData = response.data.reduce((acc, entry) => {
          const date = entry.date;
          if (!acc[date]) {
            acc[date] = {
              date: entry.date,
              headlines: [],
              descriptions: [],
              // Use the created_at from the first entry of the day as representative
              created_at: entry.created_at 
            };
          }
          acc[date].headlines.push(entry.headline);
          acc[date].descriptions.push(entry.description);
          return acc;
        }, {});
        setCalendarData(groupedData);
      } else {
        setCalendarData({});
        setError('No calendar data found or data is not in expected format.');
      }
    } catch (err) {
      console.error("Error fetching content calendar:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch content calendar');
      setCalendarData({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ margin: 2 }}>{error}</Alert>;
  }

  const sortedDates = Object.keys(calendarData).sort((a, b) => new Date(a) - new Date(b));

  if (sortedDates.length === 0) {
    return (
      <StyledPaper>
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
          Content Calendar
        </Typography>
        <Alert severity="info">No content calendar entries found.</Alert>
      </StyledPaper>
    );
  }

  return (
    <StyledPaper>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center', mb: 3 }}>
        Content Calendar
      </Typography>
      <List>
        {sortedDates.map((date) => {
          const dayEntry = calendarData[date];
          return (
            <ListItem key={date} sx={{ alignItems: 'flex-start', p:0 }}>
              <DayEntry elevation={2} sx={{ width: '100%' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <EventIcon color="primary" />
                  </Grid>
                  <Grid item>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <TitleIcon sx={{ mr: 1, color: 'action.active' }} /> Headlines:
                        </Typography>
                        <List dense disablePadding>
                        {dayEntry.headlines.map((headline, index) => (
                            <ListItem key={`headline-${index}`} sx={{ pl: 2}}>
                                <Chip label={headline} variant="outlined" size="small" />
                            </ListItem>
                        ))}
                        </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <NotesIcon sx={{ mr: 1, color: 'action.active' }} /> Descriptions:
                        </Typography>
                        <List dense disablePadding>
                        {dayEntry.descriptions.map((description, index) => (
                            <ListItem key={`desc-${index}`} sx={{ pl: 2}}>
                                <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={description} />
                            </ListItem>
                        ))}
                        </List>
                    </Grid>
                </Grid>
              </DayEntry>
            </ListItem>
          );
        })}
      </List>
    </StyledPaper>
  );
};

export default ContentCalendarView; 