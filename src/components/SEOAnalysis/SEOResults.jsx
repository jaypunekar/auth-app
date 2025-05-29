import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  TrendingUp,
  TrendingDown,
  RemoveCircle,
  Public,
  Paid,
  MonetizationOn,
} from '@mui/icons-material';

const SEOResults = ({ data, type }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderScoreCard = (title, score, description) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ position: 'relative', pt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={score}
            color={getScoreColor(score)}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography
            variant="h4"
            color={`${getScoreColor(score)}.main`}
            sx={{ mt: 1 }}
          >
            {score}%
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderContentAnalysis = () => {
    if (!data || !data.content_analysis) return null;
    const { content_analysis } = data;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderScoreCard(
            'Content Score',
            content_analysis.score,
            'Overall content quality and optimization'
          )}
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content Insights
              </Typography>
              <List>
                {content_analysis.insights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {insight.type === 'success' && <CheckCircle color="success" />}
                      {insight.type === 'warning' && <Warning color="warning" />}
                      {insight.type === 'error' && <Error color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={insight.title}
                      secondary={insight.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderKeywordAnalysis = () => {
    if (!data || !data.keyword_groups) return null;
    const { keyword_groups, summary } = data;

    const renderKeywordGroup = (keywords, title) => (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          {title}
        </Typography>
        <Grid container spacing={2}>
          {keywords.map((keyword, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  height: '100%'
                }}
              >
                <Typography variant="subtitle1" gutterBottom noWrap>
                  {keyword.keyword}
                </Typography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item>
                    <Chip
                      icon={<TrendingUp />}
                      label={`${keyword.density.toFixed(2)}%`}
                      color={keyword.density > 1 ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      {keyword.frequency} occurrences
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );

    return (
      <Box sx={{ mt: 4 }}>
        {/* Summary Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Keyword Density Analysis Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Top Single-Word Keywords
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.top_keywords.map((kw, index) => (
                  <Chip
                    key={index}
                    label={`${kw.keyword} (${kw.density.toFixed(2)}%)`}
                    color={kw.density > 1 ? 'success' : 'default'}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Keyword Groups */}
        {keyword_groups.one_word.length > 0 && (
          renderKeywordGroup(keyword_groups.one_word, "Single Word Keywords")
        )}
        {keyword_groups.two_word.length > 0 && (
          renderKeywordGroup(keyword_groups.two_word, "Two Word Phrases")
        )}
        {keyword_groups.three_word.length > 0 && (
          renderKeywordGroup(keyword_groups.three_word, "Three Word Phrases")
        )}
        {keyword_groups.four_word.length > 0 && (
          renderKeywordGroup(keyword_groups.four_word, "Four Word Phrases")
        )}
      </Box>
    );
  };

  const renderTechnicalAudit = () => {
    if (!data || !data.technical_audit) return null;
    const { technical_audit } = data;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Technical SEO Audit
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(technical_audit.metrics).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3 }} />
          <List>
            {technical_audit.issues.map((issue, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {issue.severity === 'high' && <Error color="error" />}
                  {issue.severity === 'medium' && <Warning color="warning" />}
                  {issue.severity === 'low' && <Info color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={issue.title}
                  secondary={issue.description}
                />
                <Chip
                  label={issue.severity}
                  color={
                    issue.severity === 'high'
                      ? 'error'
                      : issue.severity === 'medium'
                      ? 'warning'
                      : 'info'
                  }
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderCompetitorAnalysis = () => {
    if (!data || !data.competitors) return null;
    const { target, competitors } = data;

    return (
      <Box sx={{ mt: 4 }}>
        {/* Target Website Summary */}
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {target.domain}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">Organic Traffic</Typography>
                <Typography variant="h4">{formatNumber(target.organic_traffic)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">Paid Traffic</Typography>
                <Typography variant="h4">{formatNumber(target.paid_traffic)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">Paid Traffic Cost</Typography>
                <Typography variant="h4">{formatCurrency(target.paid_traffic_cost)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Competitors Table */}
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Competitor</TableCell>
                <TableCell align="center">
                  <Tooltip title="Keywords in Common">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Info sx={{ mr: 1 }} />
                      Common Keywords
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Public sx={{ mr: 1 }} />
                    Organic Traffic
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Paid sx={{ mr: 1 }} />
                    Paid Traffic
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <MonetizationOn sx={{ mr: 1 }} />
                    Paid Cost
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {competitors.map((competitor, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Link
                      href={`https://${competitor.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'none' }}
                    >
                      {competitor.domain}
                    </Link>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={competitor.keywords_in_common}
                      color={competitor.keywords_in_common > 20 ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{formatNumber(competitor.organic_traffic)}</TableCell>
                  <TableCell align="right">{formatNumber(competitor.paid_traffic)}</TableCell>
                  <TableCell align="right">{formatCurrency(competitor.paid_traffic_cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" color="text.secondary" align="center">
          Location: {target.location} | Language: {target.language}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      {type === 'content-analysis' && renderContentAnalysis()}
      {type === 'keyword-density' && renderKeywordAnalysis()}
      {type === 'technical-audit' && renderTechnicalAudit()}
      {type === 'competitor-analysis' && renderCompetitorAnalysis()}
      {!['content-analysis', 'keyword-density', 'technical-audit', 'competitor-analysis'].includes(
        type
      ) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>
            <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SEOResults; 