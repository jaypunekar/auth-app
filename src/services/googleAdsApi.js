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

  // Link an existing Google Ads account using the new endpoint
  linkExistingAccount: async (customerId) => {
    try {
      console.log(`Linking existing Google Ads account: ${customerId}`);
      const response = await api.post('/google-ads/link-existing-account', { 
        customer_id: customerId 
      });
      console.log('Link existing account response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error linking existing account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Check the link status
  checkLinkStatus: async (customerId) => {
    try {
      console.log(`Checking link status for account: ${customerId}`);
      const response = await api.get(`/google-ads/check-link-status/${customerId}`);
      console.log('Check link status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking link status:', error);
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
  },

  // Test update a Google Ads campaign
  testUpdateCampaign: async (campaignId, campaignData) => {
    try {
      console.log(`Test updating Google Ads campaign ${campaignId} with data:`, campaignData);
      const response = await api.post(`/google-ads/test-update-campaign/${campaignId}`, campaignData);
      console.log('Test update response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error test updating Google Ads campaign ${campaignId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Get responsive search ads for a campaign
  getResponsiveSearchAds: async (campaignId, adGroupId = null) => {
    try {
      console.log(`Fetching responsive search ads for campaign ${campaignId}...`);
      const url = adGroupId 
        ? `/google-ads/responsive-search-ads?campaign_id=${campaignId}&ad_group_id=${adGroupId}`
        : `/google-ads/responsive-search-ads?campaign_id=${campaignId}`;
      
      const response = await api.get(url);
      console.log('Responsive search ads response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting responsive search ads for campaign ${campaignId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Update a responsive search ad
  updateResponsiveSearchAd: async (adId, adData) => {
    try {
      console.log(`Updating responsive search ad ${adId} with data:`, adData);
      const response = await api.put(`/google-ads/responsive-search-ad`, {
        ad_id: adId,
        ...adData
      });
      console.log('Responsive search ad update response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating responsive search ad ${adId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Add funds to a Google Ads account
  addFunds: async (amount) => {
    try {
      console.log(`Adding ${amount} to Google Ads account`);
      const response = await api.post('/google-ads/add-funds', { amount });
      console.log('Add funds response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding funds to Google Ads account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Create a Stripe checkout session for adding funds
  createFundsCheckout: async (amount) => {
    try {
      console.log(`Creating checkout session for ${amount} Google Ads funds`);
      const response = await api.post('/google-ads/create-funds-checkout', { amount });
      console.log('Checkout session response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session for funds:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Get the funds balance for the Google Ads account
  getFunds: async () => {
    try {
      console.log('Fetching Google Ads account funds...');
      const response = await api.get('/google-ads/funds');
      console.log('Google Ads funds response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting Google Ads account funds:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Unlink a Google Ads account (only available for linked accounts, not created accounts)
  unlinkAccount: async () => {
    try {
      console.log('Unlinking Google Ads account');
      const response = await api.post('/google-ads/unlink-account');
      console.log('Unlink account response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error unlinking Google Ads account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  }
};

export default googleAdsApi; 