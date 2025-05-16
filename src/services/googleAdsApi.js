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

  // Get previously linked Google Ads accounts
  getPreviouslyLinkedAccounts: async () => {
    try {
      console.log('Fetching previously linked Google Ads accounts...');
      const response = await api.get('/google-ads/previously-linked-accounts');
      console.log('Previously linked accounts response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting previously linked accounts:', error);
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

  // Link an existing Google Ads account
  linkExistingAccount: async (customerId) => {
    try {
      console.log(`Linking existing Google Ads account: ${customerId}`);
      const response = await api.post('/google-ads/link-existing-account', { customer_id: customerId });
      console.log('Link existing account response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error linking existing Google Ads account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Force unlink a Google Ads account
  forceUnlinkAccount: async (customerId) => {
    try {
      console.log(`Force unlinking Google Ads account: ${customerId}`);
      const response = await api.post('/google-ads/force-unlink-account', { 
        customer_id: customerId 
      });
      console.log('Force unlink account response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error force unlinking Google Ads account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Check link status
  checkLinkStatus: async (customerId) => {
    try {
      console.log(`Checking link status for: ${customerId}`);
      const response = await api.get(`/google-ads/check-link-status/${customerId}`);
      console.log('Link status response:', response.data);
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

  // Check for active campaigns before unlinking
  checkActiveCampaigns: async () => {
    try {
      console.log('Checking for active campaigns before unlinking...');
      const response = await api.get('/google-ads/check-active-campaigns');
      console.log('Active campaigns check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking active campaigns:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Unlink a Google Ads account (only available for linked accounts, not created accounts)
  unlinkAccount: async (pauseCampaigns = false) => {
    try {
      console.log(`Unlinking Google Ads account, pause campaigns: ${pauseCampaigns}`);
      const response = await api.post('/google-ads/unlink-account', { 
        pause_campaigns: pauseCampaigns 
      });
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
  },
  
  // Get customer campaigns
  getCustomerCampaigns: async (customerId) => {
    try {
      console.log(`Getting campaigns for customer: ${customerId}`);
      const response = await api.get(`/google-ads/customer/${customerId}/campaigns`);
      console.log('Customer campaigns response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting customer campaigns:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Add funds to Google Ads account
  addFunds: async (amount) => {
    try {
      console.log(`Adding ${amount} funds to Google Ads account`);
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
  
  // Get campaign performance data
  getCampaignPerformance: async (customerId, dateRange) => {
    try {
      console.log(`Getting performance data for customer: ${customerId}`);
      const response = await api.post('/google-ads/campaign-performance', {
        customer_id: customerId,
        date_range: dateRange
      });
      console.log('Campaign performance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Create a new campaign
  createCampaign: async (data) => {
    try {
      console.log('Creating new campaign with data:', data);
      const response = await api.post('/google-ads/create-campaign', data);
      console.log('Create campaign response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Update a campaign
  updateCampaign: async (customerId, campaignId, data) => {
    try {
      console.log(`Updating campaign ${campaignId} for customer ${customerId}`);
      const response = await api.post(`/google-ads/customer/${customerId}/campaigns/${campaignId}/update`, data);
      console.log('Update campaign response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
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

  // Schedule a performance report for a campaign
  schedulePerformanceReport: async (campaignId, customerId, frequencyHours, endDate = null) => {
    try {
      console.log('Scheduling performance report for campaign:', campaignId);
      const data = {
        campaign_id: campaignId,
        customer_id: customerId,
        frequency_hours: frequencyHours,
        end_date: endDate
      };
      
      const response = await api.post('/google-ads/schedule-performance-report', data);
      console.log('Performance report scheduled:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error scheduling performance report:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Get all performance report schedules
  getPerformanceReportSchedules: async () => {
    try {
      console.log('Fetching performance report schedules...');
      const response = await api.get('/google-ads/performance-report-schedules');
      console.log('Performance report schedules:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting performance report schedules:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Update a performance report schedule
  updatePerformanceReportSchedule: async (scheduleId, updateData) => {
    try {
      console.log('Updating performance report schedule:', scheduleId);
      const response = await api.put(`/google-ads/performance-report-schedule/${scheduleId}`, updateData);
      console.log('Performance report schedule updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating performance report schedule:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Delete a performance report schedule
  deletePerformanceReportSchedule: async (scheduleId) => {
    try {
      console.log('Deleting performance report schedule:', scheduleId);
      const response = await api.delete(`/google-ads/performance-report-schedule/${scheduleId}`);
      console.log('Performance report schedule deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting performance report schedule:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Force reset account linking status in case of issues
  resetAccountStatus: async () => {
    try {
      console.log('Force resetting Google Ads account status');
      const response = await api.post('/google-ads/reset-account-status');
      console.log('Account status reset response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error resetting account status:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  // Get the total funds available for the user across all accounts
  getTotalFunds: async () => {
    try {
      console.log('Fetching total Google Ads funds...');
      const response = await api.get('/google-ads/total-funds');
      console.log('Total funds response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting total funds:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  }
};

export default googleAdsApi; 