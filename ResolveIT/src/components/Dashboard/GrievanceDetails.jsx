import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import webSocketService from '../../services/websocketService';
import './GrievanceDetails.css';

const GrievanceDetails = ({ grievance, onBack }) => {
    const [remarks, setRemarks] = useState([]);
    const [newRemark, setNewRemark] = useState('');
    const [submittingRemark, setSubmittingRemark] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [typingUsers, setTypingUsers] = useState([]);
    
    // NEW: Timeline states
    const [timeline, setTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    
    const typingTimeoutRef = useRef(null);
    const remarksEndRef = useRef(null);

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

    const getToken = () => {
        return localStorage.getItem('token');
    };

    const getConfig = () => {
        const token = getToken();
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

    const fetchRemarks = async () => {
        if (!grievance.id) return;
        
        try {
            const config = getConfig();
            if (!config) return;
            
            const response = await axios.get(
                `http://localhost:8080/api/dashboard/student/grievances/${grievance.id}/remarks`,
                config
            );
            setRemarks(response.data);
            
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching remarks:', error);
        }
    };

    // NEW: Fetch timeline function
    const fetchTimeline = async () => {
        if (!grievance.id) return;
        
        try {
            setLoadingTimeline(true);
            const config = getConfig();
            if (!config) return;
            
            const response = await axios.get(
                `http://localhost:8080/api/dashboard/student/grievances/${grievance.id}/timeline`,
                config
            );
            setTimeline(response.data);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleSubmitRemark = async () => {
        if (!newRemark.trim() || !grievance.id) return;
        
        try {
            setSubmittingRemark(true);
            const config = getConfig();
            if (!config) return;
            
            const response = await axios.post(
                `http://localhost:8080/api/dashboard/student/grievances/${grievance.id}/remarks`,
                { message: newRemark },
                config
            );
            
            setNewRemark('');
            sendTypingIndicator(false);
            
        } catch (error) {
            console.error('Error adding remark:', error);
            alert('❌ Failed to add remark. Please try again.');
        } finally {
            setSubmittingRemark(false);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'submitted': return '#f59e0b';
            case 'under_review': return '#8b5cf6';
            case 'in_progress': return '#3b82f6';
            case 'resolved': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'Open': return '#3498db';
            case 'In Progress': return '#2ecc71';
            case 'Resolved': return '#27ae60';
            case 'Closed': return '#95a5a6';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'submitted': return 'Submitted';
            case 'under_review': return 'Under Review';
            case 'in_progress': return 'In Progress';
            case 'resolved': return 'Resolved';
            case 'rejected': return 'Rejected';
            case 'Open': return 'Open';
            case 'In Progress': return 'In Progress';
            case 'Resolved': return 'Resolved';
            case 'Closed': return 'Closed';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserBadgeColor = (userType) => {
        switch(userType) {
            case 'student': return '#3b82f6';
            case 'staff': return '#10b981';
            case 'admin': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getUserBadgeText = (userType) => {
        switch(userType) {
            case 'student': return 'Student';
            case 'staff': return 'Staff';
            case 'admin': return 'Admin';
            default: return userType;
        }
    };

    const formatRemarkTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleNewRemark = (newRemark) => {
        setRemarks(prev => {
            const exists = prev.some(r => r.id === newRemark.id);
            if (!exists) {
                return [newRemark, ...prev];
            }
            return prev;
        });
        
        scrollToBottom();
    };

    // NEW: Status update handler
    const handleStatusUpdate = (data) => {
        console.log('🔄 Status update received:', data);
        
        // Update grievance status
        if (data.status || data.additionalData?.newStatus) {
            const newStatus = data.status || data.additionalData.newStatus;
            
            // Update grievance status
            if (typeof grievance === 'object') {
                grievance.status = newStatus;
            }
            
            // Show notification
            const oldStatus = data.additionalData?.oldStatus || 'Previous';
            const message = `✅ Status updated: ${oldStatus} → ${newStatus}`;
            
            // You can replace alert with a toast notification
            alert(message);
            
            // Refresh timeline
            fetchTimeline();
        }
    };

    const scrollToBottom = () => {
        remarksEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleTypingChange = (e) => {
        setNewRemark(e.target.value);
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        if (e.target.value.trim()) {
            sendTypingIndicator(true);
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingIndicator(false);
            }, 2000);
        } else {
            sendTypingIndicator(false);
        }
    };

    const sendTypingIndicator = (isTyping) => {
        if (isTyping !== isTyping) {
            setIsTyping(isTyping);
            webSocketService.sendTypingIndicator(grievance.id, 'current-user', isTyping);
        }
    };

    // ==================== UPDATED useEffect HOOK ====================
    useEffect(() => {
        if (!grievance.id) return;
        
        fetchRemarks();
        fetchTimeline();
        
        // DEBUG LOGS
        console.log('=== GRIEVANCE DETAILS WEBSOCKET DEBUG ===');
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
                    handleNewRemark,
                    handleStatusUpdate,
                    (error) => console.error('Subscription error:', error)
                );
            }
        } else {
            console.log('🔄 Creating new WebSocket connection...');
            // Create new connection
            webSocketService.connect(grievance.id, handleNewRemark, handleStatusUpdate);
        }
        
        // Add message handler for connection status
        webSocketService.addMessageHandler('grievance-details', {
            onConnect: () => {
                console.log('✅ GrievanceDetails: WebSocket connected');
                setConnectionStatus('Connected');
            },
            onDisconnect: () => {
                console.log('❌ GrievanceDetails: WebSocket disconnected');
                setConnectionStatus('Disconnected');
            },
            onStatusUpdate: (data, grievanceId) => {
                console.log('GrievanceDetails: Status update via handler:', data);
                handleStatusUpdate(data);
            }
        });
        
        return () => {
            console.log('🧹 GrievanceDetails: Cleaning up...');
            // Only remove our handler, DON'T unsubscribe the grievance
            webSocketService.removeMessageHandler('grievance-details');
            
            // Keep the typing timeout cleanup
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [grievance.id]);
    // ==================== END OF UPDATED useEffect ====================

    useEffect(() => {
        scrollToBottom();
    }, [remarks]);

    return (
        <div className="grievance-details-container">
            <div className="details-header">
                <button onClick={onBack} className="back-btn">
                    ← Back to Grievances
                </button>
                <h1>ResolveIT</h1>
                <div className="connection-status">
                    <div className={`status-dot ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}></div>
                    <span>{connectionStatus}</span>
                </div>
            </div>

            <div className="grievance-details-card">
                <div className="details-section">
                    <div className="section-header">
                        <h2>Grievance Details</h2>
                        <div className="status-section">
                            <div className="status-indicator">
                                <span className="status-label">Status:</span>
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
                                    <span className="id-value highlight">
                                        {grievance.grievanceId || grievance.grievance_id}
                                    </span>
                                </div>
                            </div>

                            <div className="info-row">
                                <div className="info-item">
                                    <label>Title:</label>
                                    <span className="title-value">{grievance.title}</span>
                                </div>
                                <div className="info-item">
                                    <label>Category:</label>
                                    <span className="category-tag">
                                        {grievance.category || 'Unknown'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Priority:</label>
                                    <span className={`priority-badge priority-${grievance.priority}`}>
                                        {grievance.priority ? grievance.priority.toUpperCase() : 'MEDIUM'}
                                    </span>
                                </div>
                            </div>

                            <div className="info-row">
                                <div className="info-item">
                                    <label>Submitted Date:</label>
                                    <span>{formatDate(grievance.createdAt || grievance.created_at)}</span>
                                </div>
                                <div className="info-item">
                                    <label>Assigned To:</label>
                                    <span>{grievance.assignedTo || grievance.assigned_to || 'Not assigned'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Department:</label>
                                    <span>{grievance.department || 'Unknown'}</span>
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

                {/* NEW: Status Timeline Section - Add this after the description section */}
                <div className="details-section">
                    <div className="section-header">
                        <h3>Status Journey</h3>
                        <button 
                            className="refresh-btn"
                            onClick={fetchTimeline}
                            disabled={loadingTimeline}
                        >
                            {loadingTimeline ? '🔄 Refreshing...' : '🔄 Refresh'}
                        </button>
                    </div>
                    
                    {loadingTimeline ? (
                        <div className="loading-timeline">
                            <div className="spinner-small"></div>
                            <p>Loading status history...</p>
                        </div>
                    ) : timeline.length > 0 ? (
                        <div className="status-timeline">
                            {timeline.map((entry, index) => (
                                <div key={entry.id} className="timeline-item">
                                    <div className="timeline-marker">
                                        <div 
                                            className="marker-dot"
                                            style={{backgroundColor: getStatusColor(entry.status)}}
                                        ></div>
                                        {index < timeline.length - 1 && <div className="timeline-line"></div>}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <strong style={{color: getStatusColor(entry.status)}}>
                                                {getStatusText(entry.status)}
                                            </strong>
                                            <span className="timeline-date">
                                                {formatRemarkTime(entry.createdAt)}
                                            </span>
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
                    ) : (
                        <div className="current-status-card">
                            <div className="status-indicator">
                                <div 
                                    className="status-dot-large"
                                    style={{backgroundColor: getStatusColor(grievance.status)}}
                                ></div>
                                <div className="status-info">
                                    <h4>Current Status</h4>
                                    <div 
                                        className="status-badge"
                                        style={{backgroundColor: getStatusColor(grievance.status)}}
                                    >
                                        {getStatusText(grievance.status)}
                                    </div>
                                    <p className="status-description">
                                        {grievance.status === 'submitted' && 'Your grievance has been submitted and is awaiting review.'}
                                        {grievance.status === 'under_review' && 'Your grievance is currently under review.'}
                                        {grievance.status === 'in_progress' && 'Staff is working on your grievance.'}
                                        {grievance.status === 'resolved' && 'Your grievance has been resolved.'}
                                        {grievance.status === 'rejected' && 'Your grievance has been reviewed and rejected.'}
                                        {grievance.status === 'Open' && 'Your grievance has been submitted and is awaiting review.'}
                                        {grievance.status === 'In Progress' && 'Staff is working on your grievance.'}
                                        {grievance.status === 'Resolved' && 'Your grievance has been resolved.'}
                                        {grievance.status === 'Closed' && 'Your grievance has been closed.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="details-section">
                    <div className="section-header">
                        <h3>Live Chat ({remarks.length} messages)</h3>
                        <div className="connection-badge">
                            <div className={`connection-dot ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}></div>
                            <span>{connectionStatus}</span>
                        </div>
                    </div>

                    {typingUsers.length > 0 && (
                        <div className="typing-indicator">
                            {typingUsers.map((user, index) => (
                                <span key={index}>{user} is typing...</span>
                            ))}
                            <div className="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div className="remarks-container">
                        {remarks.length === 0 ? (
                            <div className="no-remarks">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            <div className="remarks-list">
                                {remarks.map((remark, index) => (
                                    <div 
                                        key={remark.id || index} 
                                        className={`remark-card ${remark.userType === 'student' ? 'student-remark' : 'staff-remark'}`}
                                    >
                                        <div className="remark-header">
                                            <div className="remark-user">
                                                <strong>{remark.userName || 'Unknown User'}</strong>
                                                <span 
                                                    className="user-badge"
                                                    style={{backgroundColor: getUserBadgeColor(remark.userType)}}
                                                >
                                                    {getUserBadgeText(remark.userType)}
                                                </span>
                                            </div>
                                            <div className="remark-time">
                                                {formatRemarkTime(remark.createdAt)}
                                            </div>
                                        </div>
                                        <div className="remark-message">
                                            {remark.message}
                                        </div>
                                        {remark.isInternal && (
                                            <div className="internal-badge">
                                                🔒 Internal Note
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={remarksEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="add-remark-section">
                        <h4>Send Message</h4>
                        <div className="remark-form">
                            <textarea
                                className="remark-input"
                                placeholder="Type your message here..."
                                value={newRemark}
                                onChange={handleTypingChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitRemark();
                                    }
                                }}
                                rows="3"
                                disabled={submittingRemark}
                            />
                            <div className="remark-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={() => setNewRemark('')}
                                    disabled={submittingRemark || !newRemark.trim()}
                                >
                                    Clear
                                </button>
                                <button
                                    className="submit-remark-btn"
                                    onClick={handleSubmitRemark}
                                    disabled={!newRemark.trim() || submittingRemark}
                                >
                                    {submittingRemark ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                        <p className="remark-hint">
                            Press <kbd>Enter</kbd> to send • <kbd>Shift + Enter</kbd> for new line
                        </p>
                    </div>
                </div>

                {grievance.status === 'resolved' && grievance.resolvedAt && (
                    <div className="details-section">
                        <h3>Resolution</h3>
                        <div className="resolution-card">
                            <div className="resolution-info">
                                <div className="resolution-item">
                                    <label>Resolved On:</label>
                                    <span>{formatDate(grievance.resolvedAt)}</span>
                                </div>
                                {grievance.resolutionNotes && (
                                    <div className="resolution-item full-width">
                                        <label>Resolution Notes:</label>
                                        <div className="notes-box">
                                            {grievance.resolutionNotes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {grievance.hasAttachments && (
                    <div className="details-section">
                        <h3>Attachments</h3>
                        <div className="attachments-section">
                            <p className="info-text">📎 This grievance has attachments</p>
                            <button className="view-attachments-btn">
                                View Attachments
                            </button>
                        </div>
                    </div>
                )}

                <div className="details-section">
                    <h3>Next Steps</h3>
                    <div className="next-steps-card">
                        <div className="next-steps-content">
                            <p>
                                {grievance.status === 'submitted' && 'Your grievance has been submitted and is awaiting review.'}
                                {grievance.status === 'under_review' && 'Your grievance is currently under review by the concerned department.'}
                                {grievance.status === 'in_progress' && 'Your grievance is being processed. Use the chat above to communicate with staff.'}
                                {grievance.status === 'resolved' && 'Your grievance has been resolved successfully.'}
                                {grievance.status === 'rejected' && 'Your grievance has been reviewed and rejected. Please contact support for more details.'}
                            </p>
                            <div className="tracking-reminder">
                                <strong>Remember:</strong> You can track this grievance anytime using Grievance ID: 
                                <span className="grievance-id"> {grievance.grievanceId || grievance.grievance_id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrievanceDetails;