import React, { useState } from 'react';
import './AmazonCampaignEdit.css';

const AmazonCampaignEdit = ({ campaign, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: campaign.name,
    state: campaign.status,
    dailyBudget: campaign.daily_budget,
    startDate: campaign.start_date,
    endDate: campaign.end_date || ''
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
    <div className="amazon-edit-modal">
      <div className="amazon-edit-content">
        <div className="amazon-edit-header">
          <h2>Edit Campaign</h2>
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
            <select name="state" value={formData.state} onChange={handleChange}>
              <option value="enabled">Enabled</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label>Daily Budget ($)</label>
            <input
              type="number"
              name="dailyBudget"
              value={formData.dailyBudget}
              onChange={handleChange}
              min="1"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
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

export default AmazonCampaignEdit; 