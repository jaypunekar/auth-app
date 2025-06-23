import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Speed,
  Visibility,
  TrendingUp,
  Link as LinkIcon,
  Description,
  ContentCopy,
  Analytics,
  Language,
  Warning,
  CompareArrows,
  CreditCard,
} from '@mui/icons-material';
import axios from 'axios';
import SEOResults from './SEOResults';

const SEOAnalysis = () => {
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [relatedKeywords, setRelatedKeywords] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setResults(null);
    setError(null);
  };

  const analyzeWebsite = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`/api/seo/${endpoint}`, {
        url,
        keyword,
        related_keywords: relatedKeywords,
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    }
    setLoading(false);
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card sx={{ mt: 4, backgroundColor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Analysis Results
          </Typography>
          <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const tools = [
    { label: 'Content Analysis', icon: <Description />, endpoint: 'content-analysis', credits: 6 },
    { label: 'Readability', icon: <Visibility />, endpoint: 'readability', credits: 1 },
    { label: 'Keyword Density', icon: <ContentCopy />, endpoint: 'keyword-density', credits: 12 },
    { label: 'Technical Audit', icon: <Speed />, endpoint: 'technical-audit', credits: 4 },
    { label: 'SERP Analysis', icon: <Search />, endpoint: 'serp-analysis', credits: 12 },
    { label: 'Traffic Analysis', icon: <TrendingUp />, endpoint: 'traffic', credits: 4 },
    { label: 'Backlink Overview', icon: <LinkIcon />, endpoint: 'backlinks', credits: 8 },
    { label: 'Analytics', icon: <Analytics />, endpoint: 'word-count', credits: 0 },
    { label: 'Competitor Analysis', icon: <CompareArrows />, endpoint: 'competitor-analysis', credits: 4 },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary" sx={{ mb: 4 }}>
        <Language sx={{ mr: 1, verticalAlign: 'middle' }} />
        Website SEO Analysis
      </Typography>

      {/* Credit Cost Summary */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom color="primary">
          Credit Costs
        </Typography>
        <Grid container spacing={1}>
          {tools.filter(tool => tool.credits > 0).map((tool) => (
            <Grid item xs={6} sm={4} md={3} key={tool.endpoint}>
              <Chip
                icon={tool.icon}
                label={`${tool.label}: ${tool.credits} credits`}
                size="small"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Website URL"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., example.com)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Target Keyword"
              variant="outlined"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter main keyword"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Related Keywords"
              variant="outlined"
              value={relatedKeywords}
              onChange={(e) => setRelatedKeywords(e.target.value)}
              placeholder="Enter related keywords (comma separated)"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tools.map((tool, index) => (
            <Tab
              key={tool.endpoint}
              icon={tool.icon}
              label={tool.label}
              sx={{
                minHeight: 72,
                textTransform: 'none',
              }}
            />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm="auto">
              <Button
                variant="contained"
                color="primary"
                onClick={() => analyzeWebsite(tools[activeTab].endpoint)}
                disabled={loading || !url}
                startIcon={loading ? <CircularProgress size={20} /> : tools[activeTab].icon}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Analyzing...' : `Run ${tools[activeTab].label}`}
              </Button>
            </Grid>
            <Grid item xs={12} sm="auto">
              {tools[activeTab].credits > 0 && (
                <Chip
                  icon={<CreditCard />}
                  label={`${tools[activeTab].credits} Credits`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Grid>
            <Grid item xs={12} sm="auto">
              <Chip
                icon={<Warning />}
                label="This analysis may take a few moments"
                color="warning"
                variant="outlined"
                sx={{ display: loading ? 'flex' : 'none' }}
              />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {results && (
            <SEOResults
              data={results}
              type={tools[activeTab].endpoint}
            />
          )}
        </Box>
      </Paper>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
        Powered by SEO Review Tools API
      </Typography>
    </Container>
  );
};

export default SEOAnalysis; 