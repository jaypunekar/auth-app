import React, { useState } from 'react';
import './GoogleCampaignEdit.css';

const GoogleCampaignEdit = ({ campaign, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: campaign.name,
    status: campaign.status,
    daily_budget: campaign.daily_budget
  });

  const [updating, setUpdating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await onUpdate(campaign.id, formData);
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="google-edit-modal">
      <div className="google-edit-content">
        <div className="google-edit-header">
          <h2>Edit Google Campaign</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Campaign Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="ENABLED">Enabled</option>
              <option value="PAUSED">Paused</option>
              <option value="REMOVED">Removed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Daily Budget ($)</label>
            <input
              type="number"
              name="daily_budget"
              value={formData.daily_budget}
              onChange={handleChange}
              min="1"
              step="0.01"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={updating} className="submit-button">
              {updating ? 'Updating...' : 'Update Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleCampaignEdit; 