import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Campaigns.css';

const API_URL = process.env.REACT_APP_API_URL;

const Campaigns = ({ onClose }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching campaigns...'); // Debug log
      
      const response = await axios.get(`${API_URL}/api/campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Campaigns response:', response.data); // Debug log
      
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
          <h2>Your Ad Campaigns</h2>
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
                  <h3>{campaign.name}</h3>
                  <div className="campaign-details">
                    <p><strong>Status:</strong> {campaign.status}</p>
                    <p><strong>Type:</strong> {campaign.type}</p>
                    <p><strong>Daily Budget:</strong> ${campaign.daily_budget.toFixed(2)}</p>
                    <p><strong>Start Date:</strong> {campaign.start_date}</p>
                    {campaign.end_date && <p><strong>End Date:</strong> {campaign.end_date}</p>}
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
    </div>
  );
};

export default Campaigns; 