import React, { useState } from 'react';
import './FeedbackModal.css';

const FeedbackModal = ({ grievance, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating before submitting feedback.');
      return;
    }

    onSubmit({
      rating,
      comment: comment.trim()
    });
  };

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue) => {
    setHoverRating(starValue);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const getStarClass = (starValue) => {
    if (hoverRating >= starValue) {
      return 'star hover';
    } else if (rating >= starValue) {
      return 'star active';
    } else {
      return 'star';
    }
  };

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <div className="feedback-header">
          <h2>📝 Give Feedback</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="grievance-info">
          <h3>{grievance.title}</h3>
          <p><strong>Grievance ID:</strong> {grievance.grievance_id}</p>
          <p><strong>Department:</strong> {grievance.department}</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>How satisfied are you with the resolution? *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={getStarClass(star)}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="rating-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <div className="form-group">
            <label>Additional Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience or suggestions for improvement..."
              rows="4"
              className="feedback-textarea"
            />
          </div>

          <div className="feedback-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;