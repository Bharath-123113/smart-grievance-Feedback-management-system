import React, { useState, useEffect } from 'react';
import axios from 'axios';
import webSocketService from '../../services/websocketService'; // Adjust path as needed
import './TrackGrievance.css';

const TrackGrievance = ({ onFindGrievance, onViewDetails }) => {
  const [grievanceId, setGrievanceId] = useState('');
  const [grievance, setGrievance] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  // Get authentication config
  const getConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return null;
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Handle status updates from WebSocket
  const handleStatusUpdate = (data) => {
    console.log('🔄 Status update received in TrackGrievance:', data);
    
    if (data.additionalData?.newStatus) {
      // Update the grievance state
      setGrievance(prev => ({
        ...prev,
        status: data.additionalData.newStatus,
        status_timeline: [
          ...prev.status_timeline,
          {
            id: Date.now(), // temporary ID
            status: data.additionalData.newStatus,
            note: data.additionalData.note || 'Status updated',
            date: new Date().toISOString(),
            updatedByName: data.additionalData.updatedBy
          }
        ]
      }));
      
      // Show success message
      setError(`✅ Status updated to: ${data.additionalData.newStatus}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle WebSocket errors
  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    setConnectionStatus('Error');
  };

  // ==================== UPDATED WEBSOCKET CONNECTION EFFECT ====================
  useEffect(() => {
    if (!grievance) return; // Only setup WebSocket when we have a grievance
    
    console.log('=== TRACK GRIEVANCE WEBSOCKET DEBUG ===');
    console.log('Grievance ID:', grievance.id);
    console.log('WebSocket service client exists:', webSocketService.client);
    console.log('WebSocket service connected:', webSocketService.isConnected);
    console.log('Already subscribed to this grievance:', webSocketService.isSubscribedToGrievance(grievance.id));
    
    // Check if already connected
    if (webSocketService.client && webSocketService.isConnected) {
      console.log('✅ WebSocket already connected, just adding handlers');
      setConnectionStatus('Connected');
      
      // Subscribe to this specific grievance if not already subscribed
      if (!webSocketService.isSubscribedToGrievance(grievance.id)) {
        webSocketService.subscribeToGrievance(
          grievance.id,
          null,
          handleStatusUpdate,
          handleWebSocketError
        );
      }
    } else {
      console.log('🔄 Creating new WebSocket connection...');
      // Create new connection
      webSocketService.connect(grievance.id, null, handleStatusUpdate, handleWebSocketError);
    }
    
    // Add message handler for connection status
    webSocketService.addMessageHandler('track-grievance', {
      onStatusUpdate: (data, grievanceId) => {
        console.log('TrackGrievance: Status update via handler:', data);
        handleStatusUpdate(data);
      },
      onConnect: () => {
        console.log('✅ TrackGrievance: WebSocket connected');
        setConnectionStatus('Connected');
      },
      onDisconnect: () => {
        console.log('❌ TrackGrievance: WebSocket disconnected');
        setConnectionStatus('Disconnected');
      }
    });
    
    // Cleanup on unmount or when grievance changes
    return () => {
      console.log('🧹 TrackGrievance: Cleaning up...');
      // Only remove our handler, DON'T unsubscribe the grievance
      webSocketService.removeMessageHandler('track-grievance');
      
      // DON'T do this - it will disconnect for GrievanceDetails
      // if (grievance?.id) {
      //   webSocketService.unsubscribeFromGrievance(grievance.id);
      // }
    };
  }, [grievance?.id]);
  // ==================== END OF UPDATED EFFECT ====================

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!grievanceId.trim()) {
      setError('Please enter a grievance ID');
      setIsLoading(false);
      return;
    }

    try {
      const config = getConfig();
      if (!config) {
        setIsLoading(false);
        return;
      }

      // Call REAL backend API
      const response = await axios.get(
        `http://localhost:8080/api/dashboard/student/track/${grievanceId.toUpperCase()}`,
        config
      );

      // Format the response for your existing UI
      const grievanceData = response.data;
      
      // Map to match your existing UI structure
      const formattedGrievance = {
        id: grievanceData.id,
        grievance_id: grievanceData.grievance_id,
        title: grievanceData.title,
        description: grievanceData.description,
        category_name: grievanceData.category_name,
        department: grievanceData.department_name,
        priority: grievanceData.priority,
        status: grievanceData.status,
        created_at: grievanceData.formatted_created_at || grievanceData.created_at,
        assigned_to: grievanceData.assigned_to_name,
        has_attachments: grievanceData.has_attachments || false,
        status_timeline: grievanceData.status_timeline ? grievanceData.status_timeline.map(entry => ({
          id: entry.id,
          status: entry.status,
          note: entry.note || 'No additional notes',
          date: entry.formatted_date || entry.created_at,
          updatedByName: entry.updated_by_name
        })) : []
      };

      setGrievance(formattedGrievance);
      setError('');

    } catch (error) {
      console.error('Error tracking grievance:', error);
      setGrievance(null);
      
      if (error.response?.status === 404) {
        setError('No grievance found with this ID. Please check the ID and try again.');
      } else if (error.response?.status === 403) {
        setError('You do not have access to this grievance. Please check the ID.');
      } else if (error.response?.status === 401) {
        setError('Please log in to track grievances.');
        window.location.href = '/login';
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to track grievance. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      // If it's already formatted, return as-is
      if (typeof dateString === 'string' && dateString.includes(',')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': 
      case 'Open': return '#f59e0b';
      case 'under_review': 
      case 'In Review': return '#8b5cf6';
      case 'in_progress': 
      case 'In Progress': return '#3b82f6';
      case 'resolved': 
      case 'Resolved': return '#10b981';
      case 'rejected': 
      case 'Rejected': 
      case 'Closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'submitted': return 'Submitted';
      case 'Open': return 'Open';
      case 'under_review': return 'Under Review';
      case 'In Review': return 'In Review';
      case 'in_progress': return 'In Progress';
      case 'In Progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'Resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      case 'Closed': return 'Closed';
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
          <div className="connection-indicator">
            <div className={`connection-dot ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}></div>
            <span>WebSocket: {connectionStatus}</span>
          </div>
          <h3>Enter Grievance ID</h3>
          <p>Track the status of your grievance using the unique Grievance ID provided during submission</p>
        </div>

        <form onSubmit={handleTrack} className="track-form">
          <div className="form-group">
            <label>Grievance ID</label>
            <input
              type="text"
              placeholder="e.g., GRV-2024-001"
              value={grievanceId}
              onChange={(e) => setGrievanceId(e.target.value)}
              className="track-input"
              style={{ textTransform: 'uppercase' }}
            />
            <small className="input-hint">
              🔍 Enter your Grievance ID (format: GRV-YYYY-NNN)
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
          <div className={`status-message ${error.includes('✅') ? 'success' : 'error'}`}>
            {error.includes('✅') ? '✓' : '❌'} {error}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Fetching grievance details...</p>
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
              <div className="connection-badge">
                <div className={`connection-dot ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}></div>
                <span>Live Updates: {connectionStatus}</span>
              </div>
              <button 
                className="refresh-btn-small"
                onClick={() => handleTrack({ preventDefault: () => {} })}
                disabled={isLoading}
              >
                {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
              </button>
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
              {grievance.status_timeline && grievance.status_timeline.length > 0 && (
                <p className="status-date">
                  Last updated: {formatDate(grievance.status_timeline[grievance.status_timeline.length - 1]?.date)}
                </p>
              )}
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
                  <span className="category-tag">{grievance.category_name || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <strong>Priority:</strong>
                  <span className={`priority-badge priority-${grievance.priority?.toLowerCase() || 'medium'}`}>
                    {grievance.priority || 'Medium'}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Submitted Date:</strong>
                  <span>{formatDate(grievance.created_at)}</span>
                </div>
                <div className="detail-item">
                  <strong>Assigned To:</strong>
                  <span>{grievance.assigned_to || 'Not assigned yet'}</span>
                </div>
                <div className="detail-item">
                  <strong>Department:</strong>
                  <span>{grievance.department || 'Not specified'}</span>
                </div>
              </div>

              <div className="description-section">
                <strong>Description:</strong>
                <p className="description-text">{grievance.description}</p>
              </div>

              {grievance.has_attachments && (
                <div className="attachments-badge">
                  📎 This grievance has attachments
                </div>
              )}

              <button
                className="view-details-btn"
                onClick={handleViewDetails}
              >
                📖 View Full Details
              </button>
            </div>
          </div>

          {/* Updated Timeline Section */}
          {grievance.status_timeline && grievance.status_timeline.length > 0 && (
            <div className="status-timeline">
              <div className="timeline-header-section">
                <h4>🕒 Status Timeline</h4>
                <span className="timeline-count">
                  ({grievance.status_timeline.length} status updates)
                </span>
              </div>
              <div className="timeline">
                {grievance.status_timeline.map((entry, index) => (
                  <div key={entry.id || index} className="timeline-item">
                    <div className="timeline-marker-container">
                      <div
                        className="timeline-marker"
                        style={{backgroundColor: getStatusColor(entry.status)}}
                      ></div>
                      {index < grievance.status_timeline.length - 1 && (
                        <div className="timeline-line"></div>
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong className="timeline-status" style={{color: getStatusColor(entry.status)}}>
                          {getStatusText(entry.status)}
                        </strong>
                        <span className="timeline-date">{formatDate(entry.date)}</span>
                      </div>
                      <p className="timeline-note">{entry.note}</p>
                      {entry.updatedByName && entry.updatedByName !== "System" && (
                        <small className="updated-by">
                          Updated by: {entry.updatedByName}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="next-steps">
            <h4>Next Steps</h4>
            <p>
              {grievance.status === 'Open' || grievance.status === 'submitted' 
                ? 'Your grievance has been submitted and is awaiting review by the concerned department.'
                : grievance.status === 'In Progress' || grievance.status === 'in_progress' || grievance.status === 'under_review'
                ? 'Your grievance is currently being processed. The concerned department is working on it.'
                : grievance.status === 'Resolved' || grievance.status === 'resolved'
                ? 'Your grievance has been resolved successfully. If you have any concerns, please contact support.'
                : grievance.status === 'Rejected' || grievance.status === 'rejected'
                ? 'Your grievance has been reviewed and rejected. Please contact support for more details.'
                : 'Your grievance is being processed. The concerned department is working on it.'
              }
            </p>
            <div className="tracking-reminder">
              <strong>Remember:</strong> You can track this grievance anytime using Grievance ID: 
              <span className="grievance-id"> {grievance.grievance_id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackGrievance;