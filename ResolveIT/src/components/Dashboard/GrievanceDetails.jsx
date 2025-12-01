import React from 'react';
import './GrievanceDetails.css';

const GrievanceDetails = ({ grievance, categories, onBack }) => {
  if (!grievance) {
    return (
      <div className="grievance-details-container">
        <div className="error-state">
          <h2>❌ Grievance Not Found</h2>
          <p>The requested grievance could not be found.</p>
          <button onClick={onBack} className="back-btn">
            ← Back to Grievances
          </button>
        </div>
      </div>
    );
  }

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

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
  };

  return (
    <div className="grievance-details-container">
      <div className="details-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Grievances
        </button>
        <h1>ResolveIT</h1>
      </div>

      <div className="grievance-details-card">
        <div className="details-section">
          <div className="section-header">
            <h2>Grievance Details</h2>
            <div className="status-section">
              <div className="status-indicator">
                <span className="status-label">In Progress</span>
                <div
                  className="status-badge-large"
                  style={{backgroundColor: getStatusColor(grievance.status)}}
                >
                  {getStatusText(grievance.status)}
                </div>
              </div>
            </div>
          </div>

          <div className="basic-information">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="info-row">
                <div className="info-item">
                  <label>Grievance ID:</label>
                  <span className="id-value highlight">{grievance.grievance_id}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <label>Title:</label>
                  <span className="title-value">{grievance.title}</span>
                </div>
                <div className="info-item">
                  <label>Category:</label>
                  <span className="category-tag">{getCategoryName(grievance.category_id)}</span>
                </div>
                <div className="info-item">
                  <label>Priority:</label>
                  <span className={`priority-badge priority-${grievance.priority}`}>
                    {grievance.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <label>Submitted Date:</label>
                  <span>{grievance.created_at}</span>
                </div>
                <div className="info-item">
                  <label>Assigned To:</label>
                  <span>{grievance.assigned_to}</span>
                </div>
                <div className="info-item">
                  <label>Department:</label>
                  <span>{grievance.department}</span>
                </div>
              </div>

              <div className="info-item full-width">
                <label>Description:</label>
                <div className="description-box">
                  {grievance.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {grievance.status_timeline && grievance.status_timeline.length > 0 && (
          <div className="details-section">
            <h3>Status Timeline</h3>
            <div className="timeline-detailed">
              {grievance.status_timeline.map((entry, index) => (
                <div key={index} className="timeline-item-detailed">
                  <div className="timeline-content-detailed">
                    <div className="timeline-header-detailed">
                      <div className="status-date-group">
                        <strong>{getStatusText(entry.status)}</strong>
                        <span className="timeline-date">{entry.date}</span>
                      </div>
                    </div>
                    <div className="timeline-note-box">
                      {entry.note}
                    </div>
                  </div>
                  {index < grievance.status_timeline.length - 1 && (
                    <div className="timeline-connector"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="details-section">
          <h3>Next Steps</h3>
          <div className="next-steps-card">
            <div className="next-steps-content">
              <p>Your grievance is currently being processed. The concerned department is working on it.</p>
              <div className="tracking-reminder">
                <strong>Remember:</strong> You can track this grievance anytime using Grievance ID: <span className="grievance-id">{grievance.grievance_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievanceDetails;