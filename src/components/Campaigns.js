import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AmazonCampaignEdit from './AmazonCampaignEdit';
import GoogleCampaignEdit from './GoogleCampaignEdit';
import MetaCampaignEdit from './MetaCampaignEdit';
import './Campaigns.css';

const API_URL = process.env.REACT_APP_API_URL;

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const Campaigns = ({ onClose, type = 'google', apiEndpoint = '/campaigns' }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log(`Fetching ${type} campaigns...`);
      
      const response = await axios.get(`${API_URL}/api${apiEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Campaigns response:', response.data);
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setCampaigns(response.data.campaigns || []);
      }
      
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampaign = async (campaignId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      
      if (type === 'amazon') {
        endpoint = `/amazon-campaigns/${campaignId}`;
      } else if (type === 'meta') {
        endpoint = `/meta-campaigns/${campaignId}`;
      } else {
        endpoint = `/google-campaigns/${campaignId}`;
      }

      await axios.put(
        `${API_URL}/api${endpoint}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh campaigns list
      await fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update campaign');
    }
  };

  if (loading) {
    return (
      <div className="campaigns-modal">
        <div className="campaigns-content">
          <div className="campaigns-loading">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="campaigns-modal">
      <div className="campaigns-content">
        <div className="campaigns-header">
          <h2>Your {
            type === 'amazon' ? 'Amazon' : 
            type === 'meta' ? 'Meta' : 'Google'
          } Ad Campaigns</h2>
          <button onClick={onClose}>×</button>
        </div>
        
        {error ? (
          <div className="campaigns-error">{error}</div>
        ) : (
          <div className="campaigns-list">
            {campaigns.length === 0 ? (
              <p>No campaigns found. Create a campaign using the chat assistant!</p>
            ) : (
              campaigns.map(campaign => (
                <div key={campaign.id} className="campaign-card">
                  <div className="campaign-header">
                    <h3>{campaign.name}</h3>
                    <button 
                      className={`edit-button ${type}-edit-button`}
                      onClick={() => setEditingCampaign(campaign)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="campaign-details">
                    <p><strong>Status:</strong> {campaign.status}</p>
                    <p><strong>Type:</strong> {campaign.type}</p>
                    <p><strong>Daily Budget:</strong> ${campaign.daily_budget.toFixed(2)}</p>
                    <p><strong>Start Date:</strong> {formatDate(campaign.start_date)}</p>
                    {campaign.end_date && (
                      <p><strong>End Date:</strong> {formatDate(campaign.end_date)}</p>
                    )}
                  </div>
                  <div className="campaign-metrics">
                    <div>
                      <strong>Impressions</strong>
                      <span>{campaign.metrics.impressions.toLocaleString()}</span>
                    </div>
                    <div>
                      <strong>Clicks</strong>
                      <span>{campaign.metrics.clicks.toLocaleString()}</span>
                    </div>
                    <div>
                      <strong>Cost</strong>
                      <span>${campaign.metrics.cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {editingCampaign && type === 'amazon' && (
        <AmazonCampaignEdit
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onUpdate={handleUpdateCampaign}
        />
      )}

      {editingCampaign && type === 'google' && (
        <GoogleCampaignEdit
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onUpdate={handleUpdateCampaign}
        />
      )}

      {editingCampaign && type === 'meta' && (
        <MetaCampaignEdit
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onUpdate={handleUpdateCampaign}
        />
      )}
    </div>
  );
};

export default Campaigns; 