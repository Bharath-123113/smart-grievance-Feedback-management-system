import React, { useState } from 'react';
import './GrievanceForm.css';

const GrievanceForm = ({ categories, user, onGrievanceSubmit, editGrievance = null }) => {
  // If editGrievance is provided, we're in edit mode
  const isEditMode = Boolean(editGrievance);

  const [formData, setFormData] = useState(
    editGrievance ? {
      title: editGrievance.title,
      description: editGrievance.description,
      category_id: editGrievance.category_id,
      priority: editGrievance.priority
      // No department_id in form data - it comes from user profile
    } : {
      title: '',
      description: '',
      category_id: 1,
      priority: 'medium'
      // No department_id in form data - it comes from user profile
    }
  );

  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Department comes from user profile, NOT form selection
    // Include attachments in the grievance data
    onGrievanceSubmit({
      ...formData,
      // No department selection - backend will use user.department automatically
      attachments: attachments
    });

    // Reset form only if it's not edit mode
    if (!isEditMode) {
      setFormData({
        title: '',
        description: '',
        category_id: 1,
        priority: 'medium'
      });
      setAttachments([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    // Simulate file upload process
    setTimeout(() => {
      const newAttachments = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toLocaleString()
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }, 1000);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grievance-form-card">
      <h2>{isEditMode ? '✏️ Edit Grievance' : '📝 Submit New Grievance'}</h2>

      {/* Show grievance ID in edit mode */}
      {isEditMode && (
        <div className="edit-mode-info">
          <p><strong>Grievance ID:</strong> {editGrievance.grievance_id}</p>
          <p><strong>Status:</strong> {editGrievance.status}</p>
        </div>
      )}

      {/* Show student's department as read-only information */}
      {!isEditMode && user && user.department && (
        <div className="department-info">
          <p><strong>Department:</strong> {user.department}</p>
          <p className="department-note">📍 Your grievance will be automatically routed to {user.department} department staff</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grievance-form">
        <div className="form-group">
          <label>Grievance Title *</label>
          <input
            type="text"
            name="title"
            placeholder="Enter a clear title for your issue"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority *</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Department selection REMOVED - using user's registered department */}

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            placeholder="Describe your grievance in detail..."
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
          />
        </div>

        {/* File Upload Section */}
        <div className="form-group">
          <label>📎 Attach Documents (Optional)</label>
          <div className="file-upload-section">
            <div className="file-input-container">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-upload-btn">
                {isUploading ? '📤 Uploading...' : '📁 Choose Files'}
              </label>
              <span className="file-info">Max 5 files, 5MB each</span>
            </div>

            {/* File List */}
            {attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Attached Files ({attachments.length})</h4>
                {attachments.map(attachment => (
                  <div key={attachment.id} className="attachment-item">
                    <div className="file-info">
                      <span className="file-name">{attachment.name}</span>
                      <span className="file-size">{formatFileSize(attachment.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={isUploading}>
          {isUploading ? '🔄 Processing...' : (isEditMode ? '💾 Update Grievance' : '✅ Submit Grievance')}
        </button>
      </form>
    </div>
  );
};

export default GrievanceForm;