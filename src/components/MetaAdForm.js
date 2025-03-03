import React, { useState } from 'react';
import './MetaAdForm.css';

const MetaAdForm = ({ onSubmit, onClose, creating }) => {
  const [formData, setFormData] = useState({
    name: '',
    objective: 'OUTCOME_TRAFFIC',
    status: 'PAUSED',
    daily_budget: '',
    targeting: {
      age_min: '',
      age_max: '',
      genders: [],
      locations: '',
      interests: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGenderChange = (gender) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        genders: prev.targeting.genders.includes(gender)
          ? prev.targeting.genders.filter(g => g !== gender)
          : [...prev.targeting.genders, gender]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="meta-ad-modal">
      <div className="meta-ad-content">
        <div className="meta-ad-header">
          <h2>Create Meta Ad Campaign</h2>
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
              placeholder="Enter campaign name"
            />
          </div>

          <div className="form-group">
            <label>Objective</label>
            <select name="objective" value={formData.objective} onChange={handleChange}>
              <option value="OUTCOME_TRAFFIC">Traffic</option>
              <option value="OUTCOME_ENGAGEMENT">Engagement</option>
              <option value="OUTCOME_LEADS">Lead Generation</option>
              <option value="OUTCOME_SALES">Sales</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="PAUSED">Paused</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          <div className="form-group">
            <label>Daily Budget (USD)</label>
            <input
              type="number"
              name="daily_budget"
              value={formData.daily_budget}
              onChange={handleChange}
              required
              min="1"
              step="0.01"
              placeholder="Enter daily budget"
            />
          </div>

          <div className="form-section">
            <h3>Targeting</h3>
            
            <div className="form-group">
              <label>Age Range</label>
              <div className="age-inputs">
                <input
                  type="number"
                  name="targeting.age_min"
                  value={formData.targeting.age_min}
                  onChange={handleChange}
                  placeholder="Min age"
                  min="13"
                  max="65"
                />
                <span>to</span>
                <input
                  type="number"
                  name="targeting.age_max"
                  value={formData.targeting.age_max}
                  onChange={handleChange}
                  placeholder="Max age"
                  min="13"
                  max="65"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gender</label>
              <div className="gender-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.targeting.genders.includes('MALE')}
                    onChange={() => handleGenderChange('MALE')}
                  />
                  Male
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.targeting.genders.includes('FEMALE')}
                    onChange={() => handleGenderChange('FEMALE')}
                  />
                  Female
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Locations (comma-separated)</label>
              <input
                type="text"
                name="targeting.locations"
                value={formData.targeting.locations}
                onChange={handleChange}
                placeholder="e.g., New York, Los Angeles"
              />
            </div>

            <div className="form-group">
              <label>Interests (comma-separated)</label>
              <input
                type="text"
                name="targeting.interests"
                value={formData.targeting.interests}
                onChange={handleChange}
                placeholder="e.g., Technology, Fashion"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="submit-button">
              {creating ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MetaAdForm; 