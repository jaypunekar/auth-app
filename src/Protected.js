import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './components/UserProfile';
import ChatBot from './components/ChatBot';
import Campaigns from './components/Campaigns';
import MetaAdForm from './components/MetaAdForm';
import axios from 'axios';
import './Protected.css';

const API_URL = process.env.REACT_APP_API_URL;

function ProtectedPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAmazonCampaigns, setShowAmazonCampaigns] = useState(false);
  const [showMetaCampaigns, setShowMetaCampaigns] = useState(false);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/verify-token/${token}`);
        if (!response.ok) {
          throw new Error('Token verification failed');
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_info');
        navigate('/');
      }
    };

    verifyToken();
  }, [navigate]);

  const handleCreateMetaCampaign = async (formData) => {
    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/create-meta-campaign`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert(`Meta campaign created successfully! Campaign ID: ${response.data.campaign_id}`);
      setShowMetaForm(false);
    } catch (error) {
      console.error('Error creating Meta campaign:', error);
      alert(error.response?.data?.detail || 'Failed to create Meta campaign');
    } finally {
      setCreating(false);
    }
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="protected-container">
      <header className="protected-header">
        <h1 className="app-title">adTask</h1>
        <div className="header-actions">
          <button 
            className="view-campaigns-btn"
            onClick={() => setShowCampaigns(true)}
          >
            View Google Campaigns
          </button>
          <button 
            className="create-meta-btn"
            onClick={() => setShowMetaForm(true)}
            disabled={creating}
          >
            Create Meta Ad
          </button>
          <button 
            className="view-amazon-btn"
            onClick={() => setShowAmazonCampaigns(true)}
          >
            View Amazon Ads
          </button>
          <button 
            className="view-meta-btn"
            onClick={() => setShowMetaCampaigns(true)}
          >
            View Meta Ads
          </button>
          <UserProfile userInfo={userInfo} />
        </div>
      </header>
      
      <div className="chatbot-container">
        <ChatBot />
      </div>

      {showCampaigns && (
        <Campaigns onClose={() => setShowCampaigns(false)} />
      )}

      {showMetaForm && (
        <MetaAdForm 
          onSubmit={handleCreateMetaCampaign}
          onClose={() => setShowMetaForm(false)}
          creating={creating}
        />
      )}

      {showAmazonCampaigns && (
        <Campaigns 
          onClose={() => setShowAmazonCampaigns(false)}
          type="amazon"
          apiEndpoint="/amazon-campaigns"
        />
      )}

      {showMetaCampaigns && (
        <Campaigns 
          onClose={() => setShowMetaCampaigns(false)}
          type="meta"
          apiEndpoint="/meta-campaigns"
        />
      )}
    </div>
  );
}

export default ProtectedPage;
