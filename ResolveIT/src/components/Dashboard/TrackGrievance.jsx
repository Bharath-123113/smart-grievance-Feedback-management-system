import React, { useState } from 'react';
import './TrackGrievance.css';

const TrackGrievance = ({ onFindGrievance, onViewDetails }) => {
  const [grievanceId, setGrievanceId] = useState('');
  const [grievance, setGrievance] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!grievanceId.trim()) {
      setError('Please enter a grievance ID');
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      const foundGrievance = onFindGrievance(grievanceId.toUpperCase());
      if (foundGrievance) {
        setGrievance(foundGrievance);
        setError('');
      } else {
        setGrievance(null);
        setError('No grievance found with this ID. Please check the ID and try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return '#f59e0b';
      case 'under_review': return '#8b5cf6';
      case 'in-progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'in-progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleViewDetails = () => {
    if (grievance && onViewDetails) {
      onViewDetails(grievance);
    }
  };

  return (
    <div className="track-grievance">
      <div className="track-form-container">
        <div className="track-header">
          <h2>Track Grievance Status</h2>
          <h3>Enter Grievance ID</h3>
          <p>Track the status of your grievance using the unique Grievance ID provided during submission</p>
        </div>

        <form onSubmit={handleTrack} className="track-form">
          <div className="form-group">
            <label>Grievance ID</label>
            <input
              type="text"
              placeholder="e.g., GRIX-2024-001"
              value={grievanceId}
              onChange={(e) => setGrievanceId(e.target.value)}
              className="track-input"
              style={{ textTransform: 'uppercase' }}
            />
            <small className="input-hint">
              🔍 Enter your Grievance ID (format: GRIX-YYYY-NNN)
            </small>
          </div>

          <button
            type="submit"
            className={`track-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '🔍 Searching...' : '🔍 Track Status'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
      </div>

      {grievance && (
        <div className="grievance-status">
          <div className="status-header">
            <h3>📋 Grievance Status</h3>
            <div className="tracking-info">
              <div className="id-badge">
                <strong>Grievance ID:</strong>
                <span className="id-value">{grievance.grievance_id}</span>
              </div>
            </div>
          </div>

          <div className="status-overview">
            <div className="current-status" style={{borderLeftColor: getStatusColor(grievance.status)}}>
              <h4>Current Status</h4>
              <div
                className="status-badge-large"
                style={{backgroundColor: getStatusColor(grievance.status)}}
              >
                {getStatusText(grievance.status)}
              </div>
              <p className="status-date">Last updated: {grievance.status_timeline?.[grievance.status_timeline.length - 1]?.date}</p>
            </div>

            <div className="grievance-details-card">
              <h4>Grievance Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Title:</strong>
                  <span>{grievance.title}</span>
                </div>
                <div className="detail-item">
                  <strong>Category:</strong>
                  <span className="category-tag">{grievance.category_name}</span>
                </div>
                <div className="detail-item">
                  <strong>Priority:</strong>
                  <span className={`priority-badge priority-${grievance.priority}`}>
                    {grievance.priority}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Submitted Date:</strong>
                  <span>{grievance.created_at}</span>
                </div>
                <div className="detail-item">
                  <strong>Assigned To:</strong>
                  <span>{grievance.assigned_to}</span>
                </div>
                <div className="detail-item">
                  <strong>Department:</strong>
                  <span>{grievance.department}</span>
                </div>
              </div>

              <div className="description-section">
                <strong>Description:</strong>
                <p className="description-text">{grievance.description}</p>
              </div>

              <button
                className="view-details-btn"
                onClick={handleViewDetails}
              >
                📖 View Full Details
              </button>
            </div>
          </div>

          {grievance.status_timeline && grievance.status_timeline.length > 0 && (
            <div className="status-timeline">
              <h4>🕒 Status Timeline</h4>
              <div className="timeline">
                {grievance.status_timeline.map((entry, index) => (
                  <div key={index} className="timeline-item">
                    <div
                      className="timeline-marker"
                      style={{backgroundColor: getStatusColor(entry.status)}}
                    ></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{getStatusText(entry.status)}</strong>
                        <span className="timeline-date">{entry.date}</span>
                      </div>
                      <p className="timeline-note">{entry.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="next-steps">
            <h4>Next Steps</h4>
            <p>Your grievance is currently being processed. The concerned department is working on it.</p>
            <div className="tracking-reminder">
              <strong>Remember:</strong> You can track this grievance anytime using Grievance ID: <span className="grievance-id">{grievance.grievance_id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackGrievance;