import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Divider
} from '@mui/material';
import {
  Storage as StorageIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';

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

const DatabaseViewer = () => {
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
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/table-names');
        setTables(response.data);
        
        // Set the first table as the default
        if (response.data.length > 0 && !selectedTable) {
          setSelectedTable(response.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError('Failed to load database tables: ' + (err.response?.data?.detail || err.message));
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Fetch database stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/database-stats');
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching database stats:', err);
        setError('Failed to load database statistics: ' + (err.response?.data?.detail || err.message));
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch table data when selectedTable changes
  useEffect(() => {
    if (!selectedTable) return;

    const fetchTableData = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * rowsPerPage;
        const response = await axios.get(`/api/admin/table-data/${selectedTable}?limit=${rowsPerPage}&offset=${offset}`);
        setTableData(response.data);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching data for table ${selectedTable}:`, err);
        setError(`Failed to load data for table ${selectedTable}: ` + (err.response?.data?.detail || err.message));
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
        try {
          setLoading(true);
          const response = await axios.get('/api/admin/database-stats');
          setStats(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error refreshing database stats:', err);
          setError('Failed to refresh database statistics: ' + (err.response?.data?.detail || err.message));
          setLoading(false);
        }
      };
      fetchStats();
    } else {
      // Refresh table data
      const fetchTableData = async () => {
        try {
          setLoading(true);
          const offset = (page - 1) * rowsPerPage;
          const response = await axios.get(`/api/admin/table-data/${selectedTable}?limit=${rowsPerPage}&offset=${offset}`);
          setTableData(response.data);
          setLoading(false);
        } catch (err) {
          console.error(`Error refreshing data for table ${selectedTable}:`, err);
          setError(`Failed to refresh data for table ${selectedTable}: ` + (err.response?.data?.detail || err.message));
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
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
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
        {stats && !loading && (
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
              {Object.entries(stats.subscription_breakdown).map(([status, count]) => (
                <Chip 
                  key={status} 
                  label={`${status}: ${count}`} 
                  color={status === 'active' ? 'success' : status === 'canceled' ? 'error' : 'default'}
                  sx={{ fontSize: '1rem', py: 1 }}
                />
              ))}
            </Box>
          </>
        )}
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
            >
              {tables.map((table) => (
                <MenuItem key={table} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {tableData && !loading && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {tableData.table_name} ({tableData.data.length} records shown)
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

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={10} // You would calculate this based on total records
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          </>
        )}
      </TabPanel>
    </Paper>
  );
};

export default DatabaseViewer; 