import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Tab, Tabs, 
  CircularProgress, Alert, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, 
  Card, CardContent, Divider 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function StatsCard({ title, value, icon }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" component="div" sx={{ mt: 2 }}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function DataTable({ data }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  // Get column names from the first row
  const columns = Object.keys(data[0]);
  
  // Slice data for pagination
  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="data table" size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover>
                {columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`}>
                    {formatCellValue(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
}

// Helper function to format cell values
function formatCellValue(value) {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Format dates
  if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))) {
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return value;
    }
  }
  
  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Format objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return value;
}

const DatabaseExplorer = () => {
  const { isAuthenticated } = useAuth();
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/database');
        setDbData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching database data:', err);
        setError('Failed to load database information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Database Explorer
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View the application database contents and statistics.
        </Typography>
      </Box>
      
      {dbData && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>System Statistics</Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <StatsCard 
                  title="Total Users" 
                  value={dbData.stats.total_users} 
                  icon={null} 
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatsCard 
                  title="Pro Users" 
                  value={dbData.stats.total_pro_users} 
                  icon={null} 
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatsCard 
                  title="Ad Campaigns" 
                  value={dbData.stats.total_campaigns} 
                  icon={null} 
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatsCard 
                  title="Chat Messages" 
                  value={dbData.stats.total_messages} 
                  icon={null} 
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ mb: 4 }}>
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {dbData.tables.map((table, index) => (
                <Tab key={index} label={`${table.name} (${table.total})`} />
              ))}
            </Tabs>
            
            {dbData.tables.map((table, index) => (
              <TabPanel key={index} value={tabIndex} index={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{table.name}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Showing {table.data.length} of {table.total} records
                  </Typography>
                </Box>
                <DataTable data={table.data} />
              </TabPanel>
            ))}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default DatabaseExplorer; 