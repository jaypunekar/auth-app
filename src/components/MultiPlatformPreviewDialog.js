import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { adCampaignAPI } from '../services/api';
import CampaignPreviewDialog from './CampaignPreviewDialog';

const MultiPlatformPreviewDialog = ({ 
  open, 
  onClose, 
  campaignDataList, 
  onSuccess,
  onAllCompleted
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentCampaignData, setCurrentCampaignData] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [completedCampaigns, setCompletedCampaigns] = useState([]);

  useEffect(() => {
    if (campaignDataList && campaignDataList.length > 0 && open) {
      setCurrentCampaignData(campaignDataList[activeStep]);
    }
  }, [campaignDataList, activeStep, open]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => {
      const nextStep = prevActiveStep + 1;
      if (nextStep < campaignDataList.length) {
        setCurrentCampaignData(campaignDataList[nextStep]);
        return nextStep;
      }
      return prevActiveStep;
    });
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => {
      const prevStep = prevActiveStep - 1;
      if (prevStep >= 0) {
        setCurrentCampaignData(campaignDataList[prevStep]);
        return prevStep;
      }
      return prevActiveStep;
    });
  };

  const handlePreview = () => {
    setPreviewDialogOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewDialogOpen(false);
  };

  const handleClose = () => {
    onClose(false);
  };

  const handleCampaignSuccess = (campaign) => {
    setCompletedCampaigns([...completedCampaigns, campaign]);
    
    if (onSuccess) {
      onSuccess(campaign);
    }
    
    if (activeStep < campaignDataList.length - 1) {
      handleNext();
    } else {
      if (onAllCompleted) {
        onAllCompleted(completedCampaigns);
      }
      onClose(true);
    }
  };

  const isLastStep = activeStep === campaignDataList.length - 1;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            Multi-Platform Campaign Setup ({activeStep + 1}/{campaignDataList.length})
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {campaignDataList.map((data, index) => (
              <Step key={index}>
                <StepLabel>{data.platform}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {currentCampaignData && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {currentCampaignData.platform} Campaign
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Title</Typography>
                <Typography variant="body1">{currentCampaignData.title}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Description</Typography>
                <Typography variant="body1">{currentCampaignData.description}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Budget</Typography>
                <Typography variant="body1">${currentCampaignData.budget} ({currentCampaignData.budget_type})</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Target Audience</Typography>
                <Typography variant="body1">
                  Age: {currentCampaignData.target_audience.age_min}-{currentCampaignData.target_audience.age_max}, 
                  Gender: {currentCampaignData.target_audience.gender}, 
                  Location: {currentCampaignData.target_audience.location}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Keywords</Typography>
                <Typography variant="body1">
                  {currentCampaignData.keywords?.join(', ') || 'None'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Headlines</Typography>
                <Typography variant="body1">
                  {currentCampaignData.headlines?.join(', ') || 'None'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Descriptions</Typography>
                <Typography variant="body1">
                  {currentCampaignData.descriptions?.join(', ') || 'None'}
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleBack} 
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          <Button
            onClick={handlePreview}
            variant="contained"
            color="primary"
            disabled={loading || !currentCampaignData}
          >
            Edit Campaign
          </Button>
          <Button
            onClick={handleNext}
            disabled={isLastStep || loading}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>
      
      {currentCampaignData && (
        <CampaignPreviewDialog
          open={previewDialogOpen}
          onClose={handlePreviewClose}
          campaignData={currentCampaignData}
          onSuccess={handleCampaignSuccess}
        />
      )}
    </>
  );
};

export default MultiPlatformPreviewDialog; 