import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { safeApiCall, retryApiCall } from '../../utils/apiUtils';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import {
  Storage as StorageIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by DatabaseViewer ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Something went wrong displaying this component
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => this.setState({ hasError: false })}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

// Custom TabPanel component for the database viewer
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`database-tabpanel-${index}`}
      aria-labelledby={`database-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Wrapper component with error handling
const DatabaseViewer = () => {
  return (
    <ErrorBoundary>
      <DatabaseViewerContent />
    </ErrorBoundary>
  );
};

// Main component content
const DatabaseViewerContent = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fetch list of table names
  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the safeApiCall utility for better error handling
        const data = await safeApiCall(
          () => axios.get('/api/admin/table-names'), 
          [], // Fallback to empty array if the API call fails
          (err) => {
            // Custom error handling
            console.error('Error fetching tables:', err);
            setError('Failed to load database tables: ' + (err.response?.data?.detail || err.message));
          }
        );
        
        setTables(data || []);
        
        // Set the first table as the default
        if (data && data.length > 0 && !selectedTable) {
          setSelectedTable(data[0]);
        }
      } catch (err) {
        console.error('Error in fetchTables:', err);
        setError('Failed to process database tables: ' + err.message);
        setTables([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Fetch database stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the safeApiCall utility for better error handling
        const data = await safeApiCall(
          () => axios.get('/api/admin/database-stats'),
          {}, // Fallback to empty object if the API call fails
          (err) => {
            // Custom error handling
            console.error('Error fetching database stats:', err);
            setError('Failed to load database statistics: ' + (err.response?.data?.detail || err.message));
          }
        );
        
        setStats(data || {});
      } catch (err) {
        console.error('Error in fetchStats:', err);
        setError('Failed to process database statistics: ' + err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch table data when selectedTable changes
  useEffect(() => {
    if (!selectedTable) return;

    const fetchTableData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const offset = (page - 1) * rowsPerPage;
        
        // Use the safeApiCall utility for better error handling
        const data = await safeApiCall(
          () => axios.get(`/api/admin/table-data/${selectedTable}?limit=${rowsPerPage}&offset=${offset}`),
          null, // Fallback to null if the API call fails
          (err) => {
            // Custom error handling
            console.error(`Error fetching data for table ${selectedTable}:`, err);
            setError(`Failed to load data for table ${selectedTable}: ` + (err.response?.data?.detail || err.message));
          }
        );
        
        setTableData(data || null);
      } catch (err) {
        console.error(`Error in fetchTableData for ${selectedTable}:`, err);
        setError(`Failed to process data for table ${selectedTable}: ` + err.message);
        setTableData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [selectedTable, page, rowsPerPage]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
    setPage(1); // Reset to first page when changing tables
  };

  const handleRefresh = () => {
    if (activeTab === 0) {
      // Refresh stats
      const fetchStats = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // Use the safeApiCall utility for better error handling
          const data = await safeApiCall(
            () => axios.get('/api/admin/database-stats'),
            {}, // Fallback to empty object if the API call fails
            (err) => {
              // Custom error handling
              console.error('Error refreshing database stats:', err);
              setError('Failed to refresh database statistics: ' + (err.response?.data?.detail || err.message));
            }
          );
          
          setStats(data || {});
        } catch (err) {
          console.error('Error in refreshStats:', err);
          setError('Failed to process database statistics: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    } else {
      // Refresh table data
      const fetchTableData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const offset = (page - 1) * rowsPerPage;
          
          // Use the safeApiCall utility for better error handling
          const data = await safeApiCall(
            () => axios.get(`/api/admin/table-data/${selectedTable}?limit=${rowsPerPage}&offset=${offset}`),
            null, // Fallback to null if the API call fails
            (err) => {
              // Custom error handling
              console.error(`Error refreshing data for table ${selectedTable}:`, err);
              setError(`Failed to refresh data for table ${selectedTable}: ` + (err.response?.data?.detail || err.message));
            }
          );
          
          setTableData(data || null);
        } catch (err) {
          console.error(`Error in refreshTableData for ${selectedTable}:`, err);
          setError(`Failed to process data for table ${selectedTable}: ` + err.message);
          setTableData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchTableData();
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page when changing rows per page
  };

  // Render a stats card for the overview tab
  const renderStatsCard = (title, value, icon) => (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {icon}
            <Typography variant="h6" component="div" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
            {value !== undefined && value !== null ? value : 'N/A'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  // Fallback UI for when data fails to load
  const renderFallbackUI = (message) => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <ErrorIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {message || 'Unable to load data'}
      </Typography>
      <Button 
        variant="outlined" 
        startIcon={<RefreshIcon />} 
        onClick={handleRefresh}
        sx={{ mt: 2 }}
      >
        Try Again
      </Button>
    </Box>
  );

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <StorageIcon sx={{ mr: 1 }} />
        <Typography variant="h5" component="h2">
          Database Explorer
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          sx={{ ml: 'auto' }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="database tabs">
          <Tab label="Overview" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="Table Data" icon={<TableIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <TabPanel value={activeTab} index={0}>
        {!loading && !error && stats && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {renderStatsCard('Total Users', stats.total_users, <ChartIcon color="primary" />)}
              {renderStatsCard('Total Campaigns', stats.total_campaigns, <ChartIcon color="secondary" />)}
              {renderStatsCard('Chat Sessions', stats.total_chat_sessions, <ChartIcon color="success" />)}
              {renderStatsCard('Total Messages', stats.total_messages, <ChartIcon color="info" />)}
              {renderStatsCard('Google Ads Accounts', stats.total_google_ads_accounts, <ChartIcon color="warning" />)}
              {renderStatsCard('Calendar Entries', stats.total_calendar_entries, <ChartIcon color="error" />)}
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Subscription Breakdown
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stats.subscription_breakdown && Object.entries(stats.subscription_breakdown).map(([status, count]) => (
                <Chip 
                  key={status} 
                  label={`${status}: ${count}`} 
                  color={status === 'active' ? 'success' : status === 'canceled' ? 'error' : 'default'}
                  sx={{ fontSize: '1rem', py: 1 }}
                />
              ))}
              {(!stats.subscription_breakdown || Object.keys(stats.subscription_breakdown).length === 0) && (
                <Typography color="text.secondary">No subscription data available</Typography>
              )}
            </Box>
          </>
        )}
        {!loading && !error && !stats && renderFallbackUI('No database statistics available')}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="table-select-label">Select Table</InputLabel>
            <Select
              labelId="table-select-label"
              id="table-select"
              value={selectedTable}
              label="Select Table"
              onChange={handleTableChange}
              disabled={tables.length === 0}
            >
              {tables.map((table) => (
                <MenuItem key={table} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {!loading && !error && tableData && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {tableData.table_name} ({tableData.data && tableData.data.length ? tableData.data.length : 0} records shown)
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="rows-per-page-label">Rows</InputLabel>
                <Select
                  labelId="rows-per-page-label"
                  id="rows-per-page"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  label="Rows"
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {tableData.data && tableData.data.length > 0 && tableData.columns ? (
              <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {tableData.columns.map((column) => (
                        <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex} hover>
                        {tableData.columns.map((column) => (
                          <TableCell key={column}>
                            {row[column] === null 
                              ? <Typography variant="body2" color="text.secondary">null</Typography> 
                              : String(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ my: 2 }}>No data available for this table</Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={10} // You would calculate this based on total records
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                disabled={!tableData || !tableData.data || tableData.data.length === 0}
              />
            </Box>
          </>
        )}
        {!loading && !error && (!tableData || !selectedTable) && renderFallbackUI('No table data available')}
        {!loading && !error && tables.length === 0 && renderFallbackUI('No tables available to display')}
      </TabPanel>
    </Paper>
  );
};

export default DatabaseViewer; 