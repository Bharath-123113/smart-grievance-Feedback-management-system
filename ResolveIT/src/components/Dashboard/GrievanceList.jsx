import React, { useState, useEffect } from 'react';

const GrievanceList = ({ 
  grievances, 
  categories, 
  compact = false, 
  onViewDetails, 
  onEditGrievance, 
  onGiveFeedback,
  feedbackSubmitting = false 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortedGrievances, setSortedGrievances] = useState([]);
  const [submittingGrievanceId, setSubmittingGrievanceId] = useState(null);

  useEffect(() => {
    const sorted = [...grievances].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
    setSortedGrievances(sorted);
    setCurrentPage(1);
  }, [grievances]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGrievances = sortedGrievances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedGrievances.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    if (compact || totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn prev-next"
          disabled={currentPage === 1}
          onClick={() => paginate(currentPage - 1)}
        >
          ← Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              className={`page-number ${1 === currentPage ? 'active' : ''}`}
              onClick={() => paginate(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="page-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <button
            key={number}
            className={`page-number ${number === currentPage ? 'active' : ''}`}
            onClick={() => paginate(number)}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="page-ellipsis">...</span>}
            <button
              className={`page-number ${totalPages === currentPage ? 'active' : ''}`}
              onClick={() => paginate(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          className="pagination-btn prev-next"
          disabled={currentPage === totalPages}
          onClick={() => paginate(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'submitted': return '🟡';
      case 'under_review': return '🟣';
      case 'in-progress': return '🔵';
      case 'resolved': return '🟢';
      case 'rejected': return '🔴';
      default: return '⚪';
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

  const getDaysAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const handleViewDetails = (grievance) => {
    if (onViewDetails) {
      onViewDetails(grievance);
    }
  };

  const handleEditGrievance = (grievance) => {
    if (onEditGrievance) {
      onEditGrievance(grievance);
    } else {
      alert(`Edit functionality for "${grievance.title}" is not available yet.`);
    }
  };

  const handleGiveFeedback = (grievance) => {
    console.log('GrievanceList: handleGiveFeedback called for:', grievance.id);
    
    // Show submitting state
    setSubmittingGrievanceId(grievance.id);
    
    // Call parent handler
    if (onGiveFeedback) {
      onGiveFeedback(grievance);
    }
    
    // Reset submitting state after 3 seconds (in case of error)
    setTimeout(() => {
      setSubmittingGrievanceId(null);
    }, 3000);
  };

  // ==================== FEEDBACK STATUS FUNCTIONS ====================

  // Check if feedback exists
  const hasFeedback = (grievance) => {
    if (!grievance || !grievance.feedback) return false;
    
    if (typeof grievance.feedback === 'object') {
      // Check for actual feedback data
      const hasData = grievance.feedback.rating !== undefined ||
                     grievance.feedback.comment !== undefined ||
                     grievance.feedback.submitted_at !== undefined ||
                     grievance.feedback.alreadySubmitted === true ||
                     Object.keys(grievance.feedback).length > 0;
      
      return hasData;
    }
    
    return false;
  };

  // Check if feedback is currently being submitted
  const isSubmittingFeedback = (grievance) => {
    return submittingGrievanceId === grievance.id || 
           grievance.feedback?.optimistic === true ||
           (feedbackSubmitting && grievance.id === submittingGrievanceId);
  };

  // Get feedback status for display
  const getFeedbackStatus = (grievance) => {
    if (grievance.status !== 'resolved') {
      return 'not_resolved';
    }
    
    if (isSubmittingFeedback(grievance)) {
      return 'submitting';
    }
    
    if (hasFeedback(grievance)) {
      return 'submitted';
    }
    
    return 'can_submit';
  };

  // Get rating from feedback
  const getFeedbackRating = (grievance) => {
    if (!hasFeedback(grievance)) return null;
    return grievance.feedback?.rating || grievance.feedback?.ratingValue || 0;
  };

  // Get comment from feedback
  const getFeedbackComment = (grievance) => {
    if (!hasFeedback(grievance)) return '';
    return grievance.feedback?.comment || grievance.feedback?.feedbackComment || '';
  };

  // ==================== FEEDBACK UI RENDERING ====================

  const renderFeedbackButton = (grievance) => {
    const status = getFeedbackStatus(grievance);
    
    switch(status) {
      case 'not_resolved':
        return null; // No button for non-resolved grievances
        
      case 'submitting':
        return (
          <button className="feedback-btn submitting" disabled>
            <span className="spinner-small"></span> Submitting...
          </button>
        );
        
      case 'submitted':
        const rating = getFeedbackRating(grievance);
        const comment = getFeedbackComment(grievance);
        
        return (
          <div className="feedback-given">
            <div className="feedback-header">
              <span className="feedback-rating">
                ⭐ {rating}/5
              </span>
              <span className="feedback-label success">
                ✅ Feedback Submitted
              </span>
            </div>
            {comment && comment.trim() !== '' && (
              <div className="feedback-comment-preview">
                "{comment.substring(0, 50)}..."
                {comment.length > 50 && <span className="ellipsis">...</span>}
              </div>
            )}
            {grievance.feedback?.unsynced && (
              <div className="feedback-warning">
                ⚠️ Not yet synced with server
              </div>
            )}
          </div>
        );
        
      case 'can_submit':
      default:
        return (
          <button
            className="feedback-btn"
            onClick={() => handleGiveFeedback(grievance)}
            disabled={feedbackSubmitting}
          >
            {feedbackSubmitting ? '⏳ Checking...' : '💬 Give Feedback'}
          </button>
        );
    }
  };

  const renderFeedbackActionButton = (grievance) => {
    const status = getFeedbackStatus(grievance);
    
    switch(status) {
      case 'submitting':
        return (
          <button className="feedback-btn-action submitting" disabled>
            <span className="spinner-small"></span> Submitting...
          </button>
        );
        
      case 'submitted':
        const rating = getFeedbackRating(grievance);
        return (
          <span className="feedback-submitted-badge">
            ✅ {rating ? `⭐ ${rating}/5` : 'Submitted'}
          </span>
        );
        
      case 'can_submit':
        return (
          <button
            className="feedback-btn-action"
            onClick={() => handleGiveFeedback(grievance)}
            disabled={feedbackSubmitting}
          >
            💬 Feedback
          </button>
        );
        
      default:
        return null;
    }
  };

  const renderCompactFeedback = (grievance) => {
    const status = getFeedbackStatus(grievance);
    
    switch(status) {
      case 'submitting':
        return (
          <span className="feedback-compact submitting">
            <span className="spinner-tiny"></span> Submitting
          </span>
        );
        
      case 'submitted':
        const rating = getFeedbackRating(grievance);
        return (
          <span className="feedback-compact has-feedback">
            ⭐ {rating}/5
          </span>
        );
        
      case 'can_submit':
        return (
          <span 
            className="feedback-compact clickable"
            onClick={() => handleGiveFeedback(grievance)}
            title="Give Feedback"
          >
            💬 Feedback
          </span>
        );
        
      default:
        return null;
    }
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className={`grievance-list ${compact ? 'grievance-list-compact' : ''}`}>
      {!compact && (
        <div className="grievance-list-header">
          <h2>📋 My Grievances</h2>
          <span className="grievance-count">
            ({sortedGrievances.length} total) • Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      <div className="grievance-items">
        {currentGrievances.length === 0 ? (
          <div className="empty-state">
            <p>No grievances submitted yet.</p>
            {!compact && (
              <p>Submit your first grievance to get started with resolving your concerns.</p>
            )}
          </div>
        ) : (
          currentGrievances.map(grievance => (
            <div key={grievance.grievance_id || grievance.id} className="grievance-item">
              <div className="grievance-header">
                <div className="grievance-title-section">
                  <span className="grievance-status-icon">
                    {getStatusIcon(grievance.status)}
                  </span>
                  <h3 className="grievance-title">{grievance.title}</h3>
                </div>
                <div className="grievance-actions">
                  <span className={`status-badge status-${grievance.status}`}>
                    {getStatusText(grievance.status)}
                  </span>
                  {grievance.priority && (
                    <span className={`priority-badge priority-${grievance.priority}`}>
                      {getPriorityIcon(grievance.priority)} {grievance.priority}
                    </span>
                  )}
                </div>
              </div>

              <div className="grievance-meta">
                <span className="category-tag">
                  {grievance.category || getCategoryName(grievance.category_id)}
                </span>
                <span className="date">
                  {getDaysAgo(grievance.created_at)}
                </span>
                <span className="grievance-id">
                  ID: {grievance.grievance_id || grievance.id}
                </span>
                {grievance.has_attachments && (
                  <span className="attachments-indicator">
                    📎
                  </span>
                )}
              </div>

              <div className="grievance-details">
                <p className="grievance-description">{grievance.description}</p>
              </div>

              {/* Feedback Section - Only for non-compact view */}
              {!compact && grievance.status === 'resolved' && (
                <div className="feedback-section">
                  {renderFeedbackButton(grievance)}
                </div>
              )}

              {!compact && (
                <div className="grievance-footer">
                  <div className="assignment-info">
                    <span className="assigned-to">
                      <strong>Assigned to:</strong> {grievance.assignedToName || 'Not assigned'}
                    </span>
                    <span className="department">
                      <strong>Department:</strong> {grievance.department || grievance.department_name}
                    </span>
                  </div>
                  <div className="grievance-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(grievance)}
                    >
                      View Details
                    </button>
                    {grievance.status === 'submitted' && (
                      <button
                        className="edit-btn"
                        onClick={() => handleEditGrievance(grievance)}
                      >
                        Edit
                      </button>
                    )}
                    {/* Feedback action button */}
                    {grievance.status === 'resolved' && renderFeedbackActionButton(grievance)}
                  </div>
                </div>
              )}

              {/* Compact view footer */}
              {compact && (
                <div className="grievance-footer-compact">
                  <span className="assigned-to-compact">
                    👤 {grievance.assignedToName || 'Not assigned'}
                  </span>
                  <span className="department-compact">
                    🏢 {grievance.department || grievance.department_name}
                  </span>
                  {/* Feedback in compact view */}
                  {grievance.status === 'resolved' && renderCompactFeedback(grievance)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {compact && sortedGrievances.length > 3 && (
        <div className="view-all-container">
          <button className="view-all-btn" onClick={() => onViewDetails && onViewDetails()}>
            View All Grievances →
          </button>
        </div>
      )}
    </div>
  );
};

export default GrievanceList;