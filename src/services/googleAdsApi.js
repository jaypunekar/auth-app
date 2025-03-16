import api from './api';

const googleAdsApi = {
  // Get the status of the user's Google Ads account
  getAccountStatus: async () => {
    try {
      const response = await api.get('/google-ads/account-status');
      return response.data;
    } catch (error) {
      console.error('Error getting Google Ads account status:', error);
      throw error;
    }
  },

  // Link a Google Ads account
  linkAccount: async (data) => {
    try {
      const response = await api.post('/google-ads/link-account', data);
      return response.data;
    } catch (error) {
      console.error('Error linking Google Ads account:', error);
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
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
        throw new Error(error.response.data.detail || error.message);
      }
      throw error;
    }
  },
  
  // Get all Google Ads campaigns
  getCampaigns: async () => {
    try {
      const response = await api.get('/google-ads/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error getting Google Ads campaigns:', error);
      throw error;
    }
  },
  
  // Update a Google Ads campaign
  updateCampaign: async (campaignId, campaignData) => {
    try {
      const response = await api.put(`/google-ads/campaigns/${campaignId}`, campaignData);
      return response.data;
    } catch (error) {
      console.error(`Error updating Google Ads campaign ${campaignId}:`, error);
      throw error;
    }
  }
};

export default googleAdsApi; 