import React, { useState, useEffect } from 'react';

const GrievanceList = ({ grievances, categories, compact = false, onViewDetails, onEditGrievance, onGiveFeedback }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 10 items per page
  const [sortedGrievances, setSortedGrievances] = useState([]);

  // Sort grievances by newest first when component mounts or grievances change
  useEffect(() => {
    // Create a copy of grievances and sort by date (newest first)
    const sorted = [...grievances].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA; // Newest first (descending order)
    });
    setSortedGrievances(sorted);
    setCurrentPage(1); // Reset to first page when grievances change
  }, [grievances]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGrievances = sortedGrievances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedGrievances.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render pagination buttons (only for non-compact view)
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

        {/* First page */}
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

        {/* Page numbers */}
        {pageNumbers.map(number => (
          <button
            key={number}
            className={`page-number ${number === currentPage ? 'active' : ''}`}
            onClick={() => paginate(number)}
          >
            {number}
          </button>
        ))}

        {/* Last page */}
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
      alert(`Edit functionality for "${grievance.title}" is not available yet. Currently, only "submitted" grievances can be edited, but this feature is still under development.`);
    }
  };

  const handleGiveFeedback = (grievance) => {
    if (onGiveFeedback) {
      onGiveFeedback(grievance);
    }
  };

  const renderFeedbackSection = (grievance) => {
    if (grievance.status !== 'resolved') return null;

    if (grievance.feedback) {
      return (
        <div className="feedback-given">
          <span className="feedback-rating">
            ⭐ {grievance.feedback.rating}/5
          </span>
          <span className="feedback-label">Feedback Submitted</span>
          {grievance.feedback.comment && (
            <div className="feedback-comment-preview">
              "{grievance.feedback.comment.substring(0, 50)}..."
            </div>
          )}
        </div>
      );
    } else {
      return (
        <button
          className="feedback-btn"
          onClick={() => handleGiveFeedback(grievance)}
        >
          💬 Give Feedback
        </button>
      );
    }
  };

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
            <div key={grievance.grievance_id} className="grievance-item">
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
                  {getCategoryName(grievance.category_id)}
                </span>
                <span className="date">
                  {getDaysAgo(grievance.created_at)}
                </span>
                <span className="grievance-id">
                  ID: {grievance.grievance_id}
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

              {/* Feedback Section */}
              {!compact && (
                <div className="feedback-section">
                  {renderFeedbackSection(grievance)}
                </div>
              )}

              {!compact && (
                <div className="grievance-footer">
                  <div className="assignment-info">
                    <span className="assigned-to">
                      <strong>Assigned to:</strong> {grievance.assigned_to}
                    </span>
                    <span className="department">
                      <strong>Department:</strong> {grievance.department}
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
                    {/* Feedback button in actions for compact visibility */}
                    {grievance.status === 'resolved' && !grievance.feedback && (
                      <button
                        className="feedback-btn-action"
                        onClick={() => handleGiveFeedback(grievance)}
                      >
                        💬 Feedback
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Compact view footer */}
              {compact && (
                <div className="grievance-footer-compact">
                  <span className="assigned-to-compact">
                    👤 {grievance.assigned_to}
                  </span>
                  <span className="department-compact">
                    🏢 {grievance.department}
                  </span>
                  {/* Feedback in compact view */}
                  {grievance.status === 'resolved' && (
                    <span className="feedback-compact">
                      {grievance.feedback ? `⭐ ${grievance.feedback.rating}/5` : '💬 Give Feedback'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination - Only show for non-compact view and when there are multiple pages */}
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