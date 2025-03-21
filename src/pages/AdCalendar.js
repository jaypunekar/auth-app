import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  CircularProgress, 
  Alert, 
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { googleAdsAPI } from '../services/api';

const AdCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [campaigns, setCampaigns] = useState([]);
  const [responsiveAds, setResponsiveAds] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [showDebug, setShowDebug] = useState(false); // New state for debug panel visibility

  useEffect(() => {
    const fetchGoogleAdsCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await googleAdsAPI.getCampaigns();
        
        // Check if the response was successful
        if (response.data && response.data.success && response.data.data && response.data.data.campaigns) {
          // Use all campaigns even if they're not enabled
          const allCampaigns = response.data.data.campaigns;
          
          // Log campaign data to analyze date structure
          console.log("Raw Calendar Campaign Data:", allCampaigns);
          
          // Process campaigns to ensure consistent property names and reliable date handling
          const processedCampaigns = allCampaigns.map(campaign => {
            // Create a modified campaign object with consistent property names
            const processedCampaign = { ...campaign };
            
            // Prioritize using raw date formats from the API if available
            if (campaign.start_date_raw) {
              processedCampaign.startDate = campaign.start_date_raw;
            } else if (campaign.start_date) {
              processedCampaign.startDate = campaign.start_date;
            }
            
            if (campaign.end_date_raw) {
              processedCampaign.endDate = campaign.end_date_raw;
            } else if (campaign.end_date) {
              processedCampaign.endDate = campaign.end_date;
            }
            
            // Debug output of campaign dates
            console.log(`Calendar: Campaign ${campaign.name} dates:`, {
              original: { start: campaign.start_date, end: campaign.end_date },
              raw: { start: campaign.start_date_raw, end: campaign.end_date_raw },
              processed: { start: processedCampaign.startDate, end: processedCampaign.endDate }
            });
            
            return processedCampaign;
          });
          
          // Check if we have date data in campaigns
          const hasDateInfo = processedCampaigns.some(campaign => campaign.startDate || campaign.endDate);
          console.log("Calendar: Has date information:", hasDateInfo);
          
          setCampaigns(processedCampaigns);
          
          // Fetch ads for each campaign
          const adsPromises = processedCampaigns.map(campaign => 
            googleAdsAPI.getResponsiveSearchAds(campaign.id)
          );
          
          const adsResponses = await Promise.all(adsPromises);
          
          const adsMap = {};
          adsResponses.forEach((response, index) => {
            if (response.data && response.data.success && response.data.data && response.data.data.ads) {
              adsMap[processedCampaigns[index].id] = response.data.data.ads;
            }
          });
          
          setResponsiveAds(adsMap);
          console.log("Campaigns:", processedCampaigns);
          console.log("Ads Map:", adsMap);
        } else {
          setError('Failed to load Google Ads campaigns');
          setCampaigns([]);
        }
      } catch (err) {
        console.error('Error fetching Google Ads data:', err);
        setError('Failed to load Google Ads data. Please try again.');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoogleAdsCampaigns();
  }, []);

  // Calendar navigation functions
  const navigateToToday = () => {
    setDate(new Date());
  };

  const navigateToPrevious = () => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setDate(newDate);
  };

  // Helper function to get month name
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Helper function to get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper function to get day of week
  const getDayOfWeek = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Helper function to check if campaign is active on a given date
  const isCampaignActiveOnDate = (campaign, date) => {
    // Debug date parsing
    const debugDate = true; // Set to false in production
    
    // If campaign has no start or end date, assume it's always active
    if (!campaign.startDate && !campaign.endDate) {
      if (debugDate) console.log(`Campaign ${campaign.name} has no dates, showing on all dates`);
      return true;
    }
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // YYYYMMDD format check and parsing
    let startDate = null;
    if (campaign.startDate) {
      try {
        if (typeof campaign.startDate === 'string') {
          if (campaign.startDate.length === 8 && !campaign.startDate.includes('-')) {
            // Parse YYYYMMDD format
            const year = campaign.startDate.substring(0, 4);
            const month = parseInt(campaign.startDate.substring(4, 6)) - 1; // Months are 0-indexed in JS
            const day = campaign.startDate.substring(6, 8);
            startDate = new Date(parseInt(year), month, parseInt(day));
          } else {
            // For other string formats
            startDate = new Date(campaign.startDate);
          }
        } else {
          // For any other type
          startDate = new Date(campaign.startDate);
        }
        
        if (isNaN(startDate.getTime())) {
          if (debugDate) console.log(`Campaign ${campaign.name} has invalid start date: ${campaign.startDate}`);
          startDate = null;
        } else {
          startDate.setHours(0, 0, 0, 0);
          if (debugDate) console.log(`Campaign ${campaign.name} start date parsed as: ${startDate.toISOString()}`);
        }
      } catch (error) {
        console.error(`Error parsing start date for campaign ${campaign.name}:`, error);
        startDate = null;
      }
    }
    
    let endDate = null;
    if (campaign.endDate) {
      try {
        if (typeof campaign.endDate === 'string') {
          if (campaign.endDate.length === 8 && !campaign.endDate.includes('-')) {
            // Parse YYYYMMDD format
            const year = campaign.endDate.substring(0, 4);
            const month = parseInt(campaign.endDate.substring(4, 6)) - 1; // Months are 0-indexed in JS
            const day = campaign.endDate.substring(6, 8);
            endDate = new Date(parseInt(year), month, parseInt(day));
          } else {
            // For other string formats
            endDate = new Date(campaign.endDate);
          }
        } else {
          // For any other type
          endDate = new Date(campaign.endDate);
        }
        
        if (isNaN(endDate.getTime())) {
          if (debugDate) console.log(`Campaign ${campaign.name} has invalid end date: ${campaign.endDate}`);
          endDate = null;
        } else {
          endDate.setHours(0, 0, 0, 0);
          if (debugDate) console.log(`Campaign ${campaign.name} end date parsed as: ${endDate.toISOString()}`);
        }
      } catch (error) {
        console.error(`Error parsing end date for campaign ${campaign.name}:`, error);
        endDate = null;
      }
    }
    
    // Check if date is within range
    let isActive = true;
    if (startDate !== null && dateToCheck < startDate) {
      isActive = false;
      if (debugDate) console.log(`Campaign ${campaign.name} not active: Check date ${dateToCheck.toISOString()} is before start date ${startDate.toISOString()}`);
    }
    
    if (isActive && endDate !== null && dateToCheck > endDate) {
      isActive = false;
      if (debugDate) console.log(`Campaign ${campaign.name} not active: Check date ${dateToCheck.toISOString()} is after end date ${endDate.toISOString()}`);
    }
    
    if (debugDate && isActive) {
      console.log(`Campaign ${campaign.name} IS active on date ${dateToCheck.toISOString()}`);
    }
    
    return isActive;
  };

  // Helper function to check if a campaign has ads
  const hasCampaignAds = (campaignId) => {
    return responsiveAds[campaignId] && responsiveAds[campaignId].length > 0;
  };

  // Helper function to get campaigns active on a specific date
  const getCampaignsForDate = (date) => {
    // Filter campaigns that are active on the date and have ads
    return campaigns.filter(campaign => 
      isCampaignActiveOnDate(campaign, date) && 
      hasCampaignAds(campaign.id)
    );
  };

  // Helper function to get campaigns active on a specific date - fallback function
  const getAllCampaignsWithAds = () => {
    // Return all campaigns that have ads, regardless of date
    return campaigns.filter(campaign => hasCampaignAds(campaign.id));
  };

  // Helper function to format dates for display
  const formatCampaignDate = (dateString) => {
    if (!dateString) return 'No date set';
    
    // Handle YYYYMMDD format
    if (typeof dateString === 'string' && dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${month}/${day}/${year}`;
    }
    
    // Handle ISO date format (YYYY-MM-DD)
    if (typeof dateString === 'string' && dateString.includes('-') && dateString.length >= 10) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString();
      } catch (error) {
        return 'Invalid ISO date format';
      }
    }
    
    // Handle regular date format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date format';
    }
  };

  // Render month view
  const renderMonthView = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    
    // Create array of dates for the month
    const dates = [];
    for (let i = 0; i < firstDay; i++) {
      dates.push(null); // Padding for days before the 1st of the month
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }
    
    // Create rows of 7 days
    const rows = [];
    let cells = [];
    
    dates.forEach((date, index) => {
      cells.push(date);
      if (cells.length === 7 || index === dates.length - 1) {
        // Pad the last row if needed
        while (cells.length < 7) {
          cells.push(null);
        }
        rows.push([...cells]);
        cells = [];
      }
    });

    // Get all campaigns with ads for fallback
    const allCampaignsWithAds = getAllCampaignsWithAds();
    const hasDateBasedCampaigns = campaigns.some(c => c.startDate || c.endDate);

    return (
      <Box sx={{ mt: 2 }}>
        {!hasDateBasedCampaigns && allCampaignsWithAds.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No campaign date information available. Showing all campaigns with ads on all dates.
          </Alert>
        )}
        
        <Grid container spacing={1}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Grid item xs={12/7} key={index}>
              <Typography
                variant="subtitle2"
                align="center"
                sx={{ fontWeight: 'bold', color: index === 0 || index === 6 ? 'error.main' : 'text.primary' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
          
          {/* Calendar cells */}
          {rows.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((cellDate, cellIndex) => {
                if (!cellDate) {
                  return (
                    <Grid item xs={12/7} key={`empty-${rowIndex}-${cellIndex}`}>
                      <Paper 
                        sx={{
                          height: 120,
                          bgcolor: 'grey.100',
                          p: 1,
                          opacity: 0.5,
                        }}
                        elevation={0}
                      />
                    </Grid>
                  );
                }
                
                const isToday = new Date().toDateString() === cellDate.toDateString();
                
                // If we have campaigns with date info, use date filtering, otherwise show all campaigns
                const activeCampaigns = hasDateBasedCampaigns 
                  ? getCampaignsForDate(cellDate)
                  : allCampaignsWithAds;
                
                return (
                  <Grid item xs={12/7} key={`${rowIndex}-${cellIndex}`}>
                    <Paper 
                      sx={{
                        height: 120,
                        p: 1,
                        border: isToday ? '2px solid' : '1px solid',
                        borderColor: isToday ? 'primary.main' : 'grey.300',
                        bgcolor: isToday ? 'primary.light' : 'background.paper',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 3,
                          borderColor: 'primary.main',
                        },
                      }}
                      elevation={isToday ? 4 : 1}
                      onClick={() => {
                        // Set date to this cell's date and switch to day view
                        setDate(new Date(cellDate));
                        setView('day');
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: isToday ? 'bold' : 'normal',
                          color: isToday ? 'primary.contrastText' : 'text.primary',
                          mb: 0.5,
                        }}
                      >
                        {cellDate.getDate()}
                      </Typography>
                      
                      {activeCampaigns.length > 0 ? (
                        <Box sx={{ 
                          maxHeight: 90, 
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                          },
                        }}>
                          {activeCampaigns.slice(0, 3).map((campaign) => (
                            <Tooltip 
                              key={campaign.id}
                              title={
                                <React.Fragment>
                                  <Typography variant="body2">{campaign.name}</Typography>
                                  <Typography variant="caption">Start: {formatCampaignDate(campaign.startDate)}</Typography>
                                  <Typography variant="caption">End: {formatCampaignDate(campaign.endDate)}</Typography>
                                  <Typography variant="caption">Status: {campaign.status}</Typography>
                                </React.Fragment>
                              }
                            >
                              <Chip
                                label={campaign.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ 
                                  maxWidth: '100%', 
                                  mb: 0.5,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            </Tooltip>
                          ))}
                          {activeCampaigns.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{activeCampaigns.length - 3} more
                            </Typography>
                          )}
                        </Box>
                      ) : null}
                    </Paper>
                  </Grid>
                );
              })}
            </React.Fragment>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render week view
  const renderWeekView = () => {
    // Get the first day of the week (Sunday)
    const firstDay = new Date(date);
    const day = date.getDay();
    firstDay.setDate(date.getDate() - day);
    
    // Generate array of dates for the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(firstDay);
      currentDate.setDate(firstDay.getDate() + i);
      weekDates.push(currentDate);
    }

    // Get all campaigns with ads for fallback
    const allCampaignsWithAds = getAllCampaignsWithAds();
    const hasDateBasedCampaigns = campaigns.some(c => c.startDate || c.endDate);

    return (
      <Box sx={{ mt: 2 }}>
        {!hasDateBasedCampaigns && allCampaignsWithAds.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No campaign date information available. Showing all campaigns with ads on all dates.
          </Alert>
        )}
        
        <Grid container spacing={2}>
          {weekDates.map((date, index) => {
            const isToday = new Date().toDateString() === date.toDateString();
            
            // If we have campaigns with date info, use date filtering, otherwise show all campaigns
            const activeCampaigns = hasDateBasedCampaigns 
              ? getCampaignsForDate(date)
              : allCampaignsWithAds;
            
            return (
              <Grid item xs={12} key={index}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    border: isToday ? '2px solid' : '1px solid',
                    borderColor: isToday ? 'primary.main' : 'grey.300',
                    bgcolor: isToday ? 'primary.light' : 'background.paper',
                  }}
                  elevation={isToday ? 4 : 1}
                >
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: isToday ? 'bold' : 'normal' }}>
                    {getDayOfWeek(date)}, {date.getDate()} {getMonthName(date)}
                  </Typography>
                  
                  {activeCampaigns.length > 0 ? (
                    <Box>
                      {activeCampaigns.map((campaign) => {
                        const campaignAds = responsiveAds[campaign.id] || [];
                        return (
                          <Card key={campaign.id} sx={{ mb: 2, border: '1px solid', borderColor: 'primary.light' }}>
                            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="subtitle1">{campaign.name}</Typography>
                                <Chip 
                                  label={campaign.status} 
                                  size="small" 
                                  color={campaign.status === 'ENABLED' ? 'success' : 'default'}
                                  sx={{ ml: 1 }} 
                                />
                              </Box>
                              
                              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Start: {formatCampaignDate(campaign.startDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    End: {formatCampaignDate(campaign.endDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Budget: ${campaign.budget || 'N/A'}/day
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              {campaignAds.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    Ads ({campaignAds.length}):
                                  </Typography>
                                  {campaignAds.slice(0, 2).map((ad) => (
                                    <Box key={ad.id} sx={{ mt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'primary.light' }}>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                        Headlines:
                                      </Typography>
                                      <Box sx={{ ml: 1 }}>
                                        {ad.headlines && ad.headlines.slice(0, 2).map((headline, idx) => (
                                          <Typography key={idx} variant="caption" display="block">
                                            • {headline.text}
                                          </Typography>
                                        ))}
                                      </Box>
                                      
                                      <Typography variant="caption" sx={{ fontWeight: 'bold', mt: 0.5, display: 'block' }}>
                                        Descriptions:
                                      </Typography>
                                      <Box sx={{ ml: 1 }}>
                                        {ad.descriptions && ad.descriptions.slice(0, 1).map((description, idx) => (
                                          <Typography key={idx} variant="caption" display="block">
                                            • {description.text}
                                          </Typography>
                                        ))}
                                      </Box>
                                    </Box>
                                  ))}
                                  {campaignAds.length > 2 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      + {campaignAds.length - 2} more ads
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No active campaigns for this day
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // Render day view
  const renderDayView = () => {
    // Get all campaigns with ads for fallback
    const allCampaignsWithAds = getAllCampaignsWithAds();
    const hasDateBasedCampaigns = campaigns.some(c => c.startDate || c.endDate);
    
    // If we have campaigns with date info, use date filtering, otherwise show all campaigns
    const activeCampaigns = hasDateBasedCampaigns 
      ? getCampaignsForDate(date)
      : allCampaignsWithAds;

    return (
      <Box sx={{ mt: 2 }}>
        {!hasDateBasedCampaigns && allCampaignsWithAds.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No campaign date information available. Showing all campaigns with ads.
          </Alert>
        )}
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {getDayOfWeek(date)}, {date.getDate()} {getMonthName(date)}, {date.getFullYear()}
          </Typography>
          
          {activeCampaigns.length > 0 ? (
            <Grid container spacing={3}>
              {activeCampaigns.map((campaign) => {
                const campaignAds = responsiveAds[campaign.id] || [];
                return (
                  <Grid item xs={12} key={campaign.id}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6">{campaign.name}</Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip 
                              label={campaign.status} 
                              size="small" 
                              color={campaign.status === 'ENABLED' ? 'success' : 'default'}
                              sx={{ mb: 1 }} 
                            />
                            <Typography variant="body2" color="text.secondary">
                              Budget: ${campaign.budget || 'N/A'}/day
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mt: 1, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <strong>Start Date:</strong> {formatCampaignDate(campaign.startDate)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <strong>End Date:</strong> {formatCampaignDate(campaign.endDate)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        {campaignAds.length > 0 ? (
                          <Box>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                              Active Ads ({campaignAds.length})
                            </Typography>
                            
                            {campaignAds.map((ad) => (
                              <Card key={ad.id} variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
                                <CardContent>
                                  <Typography variant="subtitle2">Ad ID: {ad.id}</Typography>
                                  <Chip
                                    label={ad.status}
                                    size="small"
                                    color={ad.status === 'ENABLED' ? 'success' : 'default'}
                                    sx={{ my: 1 }}
                                  />
                                  
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Headlines:</Typography>
                                    <Box sx={{ ml: 2 }}>
                                      {ad.headlines && ad.headlines.map((headline, index) => (
                                        <Typography key={index} variant="body2">
                                          {index + 1}. {headline.text}
                                        </Typography>
                                      ))}
                                      {!ad.headlines && <Typography variant="body2">No headlines available</Typography>}
                                    </Box>
                                  </Box>
                                  
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Descriptions:</Typography>
                                    <Box sx={{ ml: 2 }}>
                                      {ad.descriptions && ad.descriptions.map((description, index) => (
                                        <Typography key={index} variant="body2">
                                          {index + 1}. {description.text}
                                        </Typography>
                                      ))}
                                      {!ad.descriptions && <Typography variant="body2">No descriptions available</Typography>}
                                    </Box>
                                  </Box>
                                  
                                  {ad.finalUrl && (
                                    <Typography variant="body2" sx={{ mt: 2 }}>
                                      <strong>Final URL:</strong> {ad.finalUrl}
                                    </Typography>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No ads found for this campaign
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Alert severity="info">No active campaigns for this day</Alert>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon sx={{ mr: 1 }} />
          Google Ads Calendar
        </Typography>
        <Tooltip title="Toggle Debug Panel">
          <IconButton onClick={() => setShowDebug(!showDebug)} color={showDebug ? "primary" : "default"}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Calendar Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={navigateToPrevious}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={navigateToNext}>
                <ChevronRightIcon />
              </IconButton>
              <IconButton onClick={navigateToToday} color="primary">
                <TodayIcon />
              </IconButton>
            </Box>
            
            <Typography variant="h5">
              {view === 'month' ? `${getMonthName(date)} ${date.getFullYear()}` :
               view === 'week' ? `Week of ${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}` :
               `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 120, mr: 1 }}>
                <InputLabel id="view-select-label">View</InputLabel>
                <Select
                  labelId="view-select-label"
                  id="view-select"
                  value={view}
                  label="View"
                  onChange={(e) => setView(e.target.value)}
                  size="small"
                >
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                </Select>
              </FormControl>
              
              <Tooltip title="Shows active Google Ads campaigns and their responsive search ads">
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* Calendar View */}
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          
          {/* Summary */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Campaign Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Active Campaigns</Typography>
                  <Typography variant="h4">{campaigns.length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Campaigns with Ads</Typography>
                  <Typography variant="h4">{Object.keys(responsiveAds).length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Total Ads</Typography>
                  <Typography variant="h4">
                    {Object.values(responsiveAds).reduce((sum, ads) => sum + ads.length, 0)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Total Daily Budget</Typography>
                  <Typography variant="h4">
                    ${campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.budget || 0), 0).toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {/* Debug Information */}
          {showDebug && (
            <Box sx={{ mt: 6, border: '1px dashed', borderColor: 'grey.500', p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Debug Information
              </Typography>
              <Typography variant="body2">
                Total Campaigns: {campaigns.length}
              </Typography>
              <Typography variant="body2">
                Total Campaigns with Ads: {Object.keys(responsiveAds).length}
              </Typography>
              <Typography variant="body2">
                Total Ads: {Object.values(responsiveAds).reduce((sum, ads) => sum + ads.length, 0)}
              </Typography>
              <Typography variant="body2">
                Date format used in API: YYYYMMDD (e.g., 20240630) or ISO date string
              </Typography>
              
              {/* Campaign Dates Info */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Campaign Dates:</Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', backgroundColor: 'grey.100' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'grey.300' }}>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Campaign Name</Box>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Status</Box>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Start Date (Raw)</Box>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>End Date (Raw)</Box>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Formatted Start</Box>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Formatted End</Box>
                        <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Has Ads</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {campaigns.slice(0, 10).map((campaign) => (
                        <Box component="tr" key={campaign.id} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
                          <Box component="td" sx={{ p: 1 }}>{campaign.name}</Box>
                          <Box component="td" sx={{ p: 1 }}>{campaign.status}</Box>
                          <Box component="td" sx={{ p: 1 }}>{campaign.startDate || 'N/A'}</Box>
                          <Box component="td" sx={{ p: 1 }}>{campaign.endDate || 'N/A'}</Box>
                          <Box component="td" sx={{ p: 1 }}>{formatCampaignDate(campaign.startDate)}</Box>
                          <Box component="td" sx={{ p: 1 }}>{formatCampaignDate(campaign.endDate)}</Box>
                          <Box component="td" sx={{ p: 1 }}>{hasCampaignAds(campaign.id) ? 'Yes' : 'No'}</Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  {campaigns.length > 10 && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Showing 10 of {campaigns.length} campaigns
                    </Typography>
                  )}
                </Paper>
              </Box>
              
              {/* Raw Campaign Data */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Raw Campaign Data (First 3):</Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', backgroundColor: 'grey.100' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                    {JSON.stringify(campaigns.slice(0, 3), null, 2)}
                  </pre>
                </Paper>
              </Box>
              
              {/* Raw Ads Data */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Raw Ads Data (First Campaign):</Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', backgroundColor: 'grey.100' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                    {campaigns.length > 0 ? 
                      JSON.stringify(responsiveAds[campaigns[0]?.id] || [], null, 2) : 
                      "No campaigns or ads data"
                    }
                  </pre>
                </Paper>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AdCalendar; 