import React from 'react';
import { Box, Container } from '@mui/material';
import SEOAnalysis from '../components/SEOAnalysis/SEOAnalysis';

const SEOAnalysisPage = () => {
  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="xl">
        <SEOAnalysis />
      </Container>
    </Box>
  );
};

export default SEOAnalysisPage; 