import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Alert,
} from '@mui/material';
import {
  Language,
  AccessTime,
  Link as LinkIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import SEOResults from './SEOResults';

const SavedAnalysisView = ({ analysis }) => {
  if (!analysis) {
    return (
      <Alert severity="error">
        No analysis data available
      </Alert>
    );
  }

  const formatDate = (dateString) => {
    try {
      // Try parsing as ISO string first
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMMM dd, yyyy HH:mm');
      }

      // If not ISO, try parsing as timestamp
      const timestamp = new Date(dateString);
      if (isValid(timestamp)) {
        return format(timestamp, 'MMMM dd, yyyy HH:mm');
      }

      // If both fail, return a fallback string
      return 'Date not available';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const handleDownload = () => {
    try {
      const dataStr = JSON.stringify(analysis.analysis_data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use a safe filename without the date if there's an issue
      const safeFilename = `seo-analysis-${analysis.url.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const dateStr = isValid(new Date(analysis.created_at)) 
        ? `-${format(new Date(analysis.created_at), 'yyyy-MM-dd')}`
        : '';
      a.download = `${safeFilename}${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading analysis:', error);
    }
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(analysis.url);
      // You could add a snackbar notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Language sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" color="primary.main">
                {analysis.name || 'SEO Analysis'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LinkIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {analysis.url}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Analyzed on {formatDate(analysis.created_at)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Tooltip title="Download Analysis">
              <IconButton onClick={handleDownload} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy URL">
              <IconButton onClick={handleShare} color="primary">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Analysis Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(analysis.analysis_data || {}).map(([key, value]) => {
          const hasData = value && Object.keys(value).length > 0;
          if (!hasData) return null;
          
          return (
            <Grid item xs={12} key={key}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <SEOResults data={value} type={key} />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default SavedAnalysisView; 