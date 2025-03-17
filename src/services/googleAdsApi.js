import api from './api';

const googleAdsApi = {
  // Get the status of the user's Google Ads account
  getAccountStatus: async () => {
    try {
      console.log('Fetching Google Ads account status...');
      const response = await api.get('/google-ads/account-status');
      console.log('Google Ads account status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting Google Ads account status:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Link a Google Ads account
  linkAccount: async (data) => {
    try {
      console.log('Linking Google Ads account with data:', data);
      const response = await api.post('/google-ads/link-account', data);
      console.log('Google Ads account linking response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error linking Google Ads account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Create a Google Ads campaign
  createCampaign: async (campaignData) => {
    try {
      console.log('Creating Google Ads campaign with data:', campaignData);
      const response = await api.post('/google-ads/create-campaign', campaignData);
      console.log('Google Ads campaign creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating Google Ads campaign:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Get all Google Ads campaigns
  getCampaigns: async () => {
    try {
      console.log('Fetching Google Ads campaigns...');
      const response = await api.get('/google-ads/campaigns');
      console.log('Google Ads campaigns response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting Google Ads campaigns:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Update a Google Ads campaign
  updateCampaign: async (campaignId, campaignData) => {
    try {
      console.log(`Updating Google Ads campaign ${campaignId} with data:`, campaignData);
      const response = await api.put(`/google-ads/campaigns/${campaignId}`, campaignData);
      console.log('Google Ads campaign update response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating Google Ads campaign ${campaignId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  }
};

export default googleAdsApi; 