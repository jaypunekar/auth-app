import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Language,
  Search,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import axios from 'axios';
import SavedAnalysisView from './SavedAnalysisView';
import SEOResults from './SEOResults';

const ComprehensiveAnalysis = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [savedError, setSavedError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [analysisName, setAnalysisName] = useState('');
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [viewingSavedAnalysis, setViewingSavedAnalysis] = useState(false);

  useEffect(() => {
    // Load saved analyses when component mounts
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    setLoadingSaved(true);
    setSavedError(null);
    try {
      const response = await axios.get('/api/seo/saved-analyses');
      setSavedAnalyses(response.data);
    } catch (err) {
      console.error('Error fetching saved analyses:', err);
      setSavedError('Failed to load saved analyses. Please try refreshing the page.');
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setViewingSavedAnalysis(false);
    try {
      const response = await axios.post('/api/seo/comprehensive-analysis', {
        url,
        location: 'United States',
        language: 'English',
        query_limit: 50,
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!results) return;

    try {
      await axios.post('/api/seo/save-analysis', {
        url: results.url,
        analysis_data: results.data,
        name: analysisName || `Analysis of ${results.url}`,
      });
      setSaveDialogOpen(false);
      setAnalysisName('');
      await fetchSavedAnalyses();
    } catch (err) {
      setError('Failed to save analysis: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await axios.delete(`/api/seo/saved-analysis/${analysisId}`);
      await fetchSavedAnalyses();
    } catch (err) {
      setError('Failed to delete analysis: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleView = async (analysisId) => {
    try {
      const response = await axios.get(`/api/seo/saved-analysis/${analysisId}`);
      setResults({
        url: response.data.url,
        name: response.data.name,
        analysis_data: response.data.analysis_data,
        created_at: response.data.created_at,
      });
      setViewingSavedAnalysis(true);
      setActiveTab(0);
    } catch (err) {
      setError('Failed to load analysis: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resultTabs = [
    { label: 'All Results', value: 'all' },
    { label: 'Readability', value: 'readability' },
    { label: 'Keywords', value: 'keyword_density' },
    { label: 'Headings', value: 'headings' },
    { label: 'Word Count', value: 'word_count' },
    { label: 'Plagiarism', value: 'plagiarism' },
    { label: 'Technical', value: 'technical_audit' },
    { label: 'Traffic', value: 'traffic' },
    { label: 'Backlinks', value: 'backlinks' },
    { label: 'Competitors', value: 'competitors' },
  ];

  const renderSavedAnalyses = () => (
    <Paper sx={{ mt: 4, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Saved Analyses
      </Typography>
      
      {savedError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {savedError}
        </Alert>
      )}

      {loadingSaved ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {savedAnalyses.map((analysis) => (
            <ListItem
              key={analysis.id}
              divider
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={analysis.name || analysis.url}
                secondary={`Analyzed on ${new Date(analysis.created_at).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <Tooltip title="View Analysis">
                  <IconButton edge="end" onClick={() => handleView(analysis.id)} sx={{ mr: 1 }}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Analysis">
                  <IconButton edge="end" onClick={() => handleDelete(analysis.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {savedAnalyses.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No saved analyses"
                secondary="Run an analysis and save it to see it here"
              />
            </ListItem>
          )}
        </List>
      )}
    </Paper>
  );

  const renderResults = () => {
    if (!results) return null;

    const selectedTab = resultTabs[activeTab].value;
    const data = selectedTab === 'all' ? results.data : { [selectedTab]: results.data[selectedTab] };

    return (
      <Box>
        {viewingSavedAnalysis ? (
          <SavedAnalysisView analysis={results} />
        ) : (
          <Card sx={{ mt: 4, backgroundColor: '#f8f9fa' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <div>
                  <Typography variant="h6" gutterBottom color="primary">
                    Comprehensive Analysis Results
                  </Typography>
                  {results.timestamp && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Generated at: {new Date(results.timestamp).toLocaleString()}
                    </Typography>
                  )}
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialogOpen(true)}
                >
                  Save Analysis
                </Button>
              </Box>
              <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                <SEOResults data={data} type={selectedTab} />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary" sx={{ mb: 4 }}>
        <Language sx={{ mr: 1, verticalAlign: 'middle' }} />
        Comprehensive SEO Analysis
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <TextField
            fullWidth
            label="Website URL"
            variant="outlined"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL (e.g., example.com)"
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleAnalyze}
            disabled={loading || !url}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          >
            {loading ? 'Analyzing...' : 'Run Comprehensive Analysis'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {results && (
        <>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {resultTabs.map((tab, index) => (
                <Tab key={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </Paper>
          {renderResults()}
        </>
      )}

      {/* Always render saved analyses section */}
      {renderSavedAnalyses()}

      {/* Save Analysis Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Analysis</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Analysis Name"
            fullWidth
            variant="outlined"
            value={analysisName}
            onChange={(e) => setAnalysisName(e.target.value)}
            placeholder={`Analysis of ${results?.url || ''}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComprehensiveAnalysis; 