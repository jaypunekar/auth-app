import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Tabs, Tab, Paper, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress, Alert, TextField,
  Accordion, AccordionSummary, AccordionDetails, Chip,
  Grid, Card, CardContent, Select, MenuItem, FormControl,
  InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DatabaseViewer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState(null);
  const [schema, setSchema] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || '/api';

  useEffect(() => {
    // Fetch list of tables when component mounts
    fetchTables();
    fetchStats();
    fetchSchema();
  }, []);

  useEffect(() => {
    // Fetch table data when a table is selected
    if (selectedTable) {
      fetchTableData(selectedTable, 1, rowsPerPage);
    }
  }, [selectedTable, rowsPerPage]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/database/tables`);
      setTables(response.data.tables);
      
      // Select the first table by default if available
      if (response.data.tables && response.data.tables.length > 0) {
        setSelectedTable(response.data.tables[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching database tables:', err);
      setError(err.response?.data?.detail || 'Failed to fetch database tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName, pageNum, pageSize) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiUrl}/database/tables/${tableName}?page=${pageNum}&page_size=${pageSize}`
      );
      setTableData(response.data);
      setPage(pageNum - 1); // API uses 1-based indexing, MUI uses 0-based
      setError(null);
    } catch (err) {
      console.error(`Error fetching data for table ${tableName}:`, err);
      setError(err.response?.data?.detail || `Failed to fetch data for table ${tableName}`);
      setTableData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${apiUrl}/database/stats`);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching database stats:', err);
      // Don't set error state as this is not critical
    }
  };

  const fetchSchema = async () => {
    try {
      const response = await axios.get(`${apiUrl}/database/schema`);
      setSchema(response.data.schema);
    } catch (err) {
      console.error('Error fetching database schema:', err);
      // Don't set error state as this is not critical
    }
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchTableData(selectedTable, newPage + 1, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchTableData(selectedTable, 1, newRowsPerPage);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearchFilterChange = (event) => {
    setSearchFilter(event.target.value.toLowerCase());
  };

  // Filter rows based on search input
  const getFilteredRows = () => {
    if (!tableData || !tableData.rows || !searchFilter) return tableData?.rows || [];
    
    return tableData.rows.filter(row => {
      return Object.values(row).some(value => {
        return value !== null && value.toString().toLowerCase().includes(searchFilter);
      });
    });
  };

  const renderStats = () => {
    if (!stats) {
      return <CircularProgress />;
    }

    return (
      <Grid container spacing={2}>
        {Object.entries(stats).map(([tableName, tableStats]) => (
          <Grid item xs={12} sm={6} md={4} key={tableName}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {tableName}
                </Typography>
                <Typography color="text.secondary">
                  Rows: {tableStats.row_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderSchema = () => {
    if (!schema) {
      return <CircularProgress />;
    }

    return (
      <Box>
        {Object.entries(schema).map(([tableName, tableSchema]) => (
          <Accordion key={tableName}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{tableName}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle1" gutterBottom>Columns:</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Nullable</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell>Primary Key</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableSchema.columns.map((column, index) => (
                      <TableRow key={index}>
                        <TableCell>{column.name}</TableCell>
                        <TableCell>{column.type}</TableCell>
                        <TableCell>{column.nullable ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{column.default || 'None'}</TableCell>
                        <TableCell>
                          {column.primary_key ? (
                            <Chip size="small" color="primary" label="PK" />
                          ) : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {tableSchema.foreign_keys.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>Foreign Keys:</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Column</TableCell>
                          <TableCell>References</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableSchema.foreign_keys.map((fk, index) => (
                          <TableRow key={index}>
                            <TableCell>{fk.constrained_columns.join(', ')}</TableCell>
                            <TableCell>
                              {fk.referred_table}.{fk.referred_columns.join(', ')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderTableData = () => {
    if (!tableData) {
      return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1">
            Select a table to view its data
          </Typography>
        </Box>
      );
    }

    const filteredRows = getFilteredRows();

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="table-select-label">Table</InputLabel>
            <Select
              labelId="table-select-label"
              value={selectedTable}
              label="Table"
              onChange={handleTableChange}
            >
              {tables.map((table) => (
                <MenuItem key={table} value={table}>{table}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchFilter}
            onChange={handleSearchFilterChange}
            sx={{ width: 250 }}
          />
        </Box>

        <Paper>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {tableData.columns.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {tableData.columns.map((column) => (
                      <TableCell key={column}>
                        {row[column] !== null ? String(row[column]) : 'null'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={tableData.pagination.total_count}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    );
  };

  if (loading && !tableData && !tables.length) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Database Viewer
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Table Data" />
          <Tab label="Schema" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderTableData()}
      {activeTab === 1 && renderSchema()}
      {activeTab === 2 && renderStats()}
    </Container>
  );
};

export default DatabaseViewer; 