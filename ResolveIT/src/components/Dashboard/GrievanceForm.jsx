import React, { useState, useEffect } from 'react';
import './GrievanceForm.css';
import { fileUploadApi } from '../../services/apiService';

const GrievanceForm = ({ categories, departments, user, onGrievanceSubmit, editGrievance = null }) => {
  // If editGrievance is provided, we're in edit mode
  const isEditMode = Boolean(editGrievance);

  const [formData, setFormData] = useState(
    editGrievance ? {
      title: editGrievance.title,
      description: editGrievance.description,
      category_id: editGrievance.category_id || editGrievance.categoryId,
      department_id: editGrievance.department_id || editGrievance.departmentId,
      priority: editGrievance.priority
    } : {
      title: '',
      description: '',
      category_id: 1,
      department_id: '',
      priority: 'medium'
    }
  );

  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Format categories for dropdown (handle both backend and frontend formats)
  const getFormattedCategories = () => {
    return categories.map(cat => ({
      category_id: cat.id || cat.category_id,
      category_name: cat.categoryName || cat.category_name || `Category ${cat.id || cat.category_id}`
    }));
  };

  // Format departments for dropdown (handle both backend and frontend formats)
  const getFormattedDepartments = () => {
    return departments.map(dept => ({
      department_id: dept.id || dept.department_id,
      department_name: dept.departmentName || dept.department_name || `Department ${dept.id || dept.department_id}`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.department_id) {
      alert('Please fill in all required fields including department');
      return;
    }

    // Include department_id and real attachments in the grievance data
    onGrievanceSubmit({
      ...formData,
      attachments: attachments.map(att => ({
        filePath: att.filePath,
        fileName: att.name,
        fileSize: att.size
      }))
    });

    // Reset form only if it's not edit mode
    if (!isEditMode) {
      setFormData({
        title: '',
        description: '',
        category_id: 1,
        department_id: '',
        priority: 'medium'
      });
      setAttachments([]);
      setUploadProgress({});
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check total files limit (max 5)
    if (attachments.length + files.length > 5) {
      alert('Maximum 5 files allowed. Please remove some files before adding more.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      // Upload each file sequentially to track progress
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds 5MB limit. Please select a smaller file.`);
          continue;
        }

        // Check file type
        const validTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validTypes.includes(fileExtension)) {
          alert(`File "${file.name}" has unsupported format. Allowed: PDF, JPG, PNG, DOC, TXT`);
          continue;
        }

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        // Simulate progress for better UX
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            if (progress >= 90) clearInterval(interval);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }, 100);
          return interval;
        };

        const progressInterval = simulateProgress();

        try {
          // Upload to backend
          const response = await fileUploadApi.uploadFile(file, 'grievance-attachments');
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));

          // Add to attachments list
          const newAttachment = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            filePath: response.filePath,
            uploadedAt: new Date().toLocaleString()
          };

          setAttachments(prev => [...prev, newAttachment]);

        } catch (uploadError) {
          clearInterval(progressInterval);
          console.error(`Error uploading ${file.name}:`, uploadError);
          alert(`Failed to upload "${file.name}": ${uploadError.message || 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error('Error in file upload process:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      e.target.value = ''; // Reset file input
    }
  };

  const removeAttachment = async (id, filePath) => {
    try {
      // Remove from backend storage if filePath exists
      if (filePath) {
        // Extract folder and filename from filePath
        const pathParts = filePath.split('/');
        if (pathParts.length >= 2) {
          const folder = pathParts[0];
          const filename = pathParts.slice(1).join('/');
          
          // Call delete API
          await fileUploadApi.deleteFile(folder, filename);
        }
      }
      
      // Remove from local state
      setAttachments(prev => prev.filter(attachment => attachment.id !== id));
      
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error removing file. It may still be removed from the list.');
      // Still remove from list even if backend delete fails
      setAttachments(prev => prev.filter(attachment => attachment.id !== id));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    switch(ext) {
      case '.pdf': return '📕';
      case '.jpg':
      case '.jpeg':
      case '.png': return '🖼️';
      case '.doc':
      case '.docx': return '📄';
      case '.txt': return '📝';
      default: return '📎';
    }
  };

  const formattedCategories = getFormattedCategories();
  const formattedDepartments = getFormattedDepartments();

  return (
    <div className="grievance-form-card">
      <h2>{isEditMode ? '✏️ Edit Grievance' : '📝 Submit New Grievance'}</h2>

      {/* Show grievance ID in edit mode */}
      {isEditMode && (
        <div className="edit-mode-info">
          <p><strong>Grievance ID:</strong> {editGrievance.grievance_id || editGrievance.grievanceId}</p>
          <p><strong>Status:</strong> {editGrievance.status}</p>
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
              {formattedCategories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Department *</label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {formattedDepartments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
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

        {/* File Upload Section - UPDATED WITH REAL UPLOAD */}
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
                disabled={isUploading || attachments.length >= 5}
              />
              <label 
                htmlFor="file-upload" 
                className={`file-upload-btn ${(isUploading || attachments.length >= 5) ? 'disabled' : ''}`}
              >
                {isUploading ? '📤 Uploading...' : '📁 Choose Files'}
              </label>
              <span className="file-info">
                Max 5 files, 5MB each (PDF, JPG, PNG, DOC, TXT)
              </span>
              {attachments.length >= 5 && (
                <span className="file-limit-warning">⚠️ Maximum 5 files reached</span>
              )}
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="upload-progress-container">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="upload-progress-item">
                    <div className="progress-file-name">{fileName}</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-percentage">{progress}%</div>
                  </div>
                ))}
              </div>
            )}

            {/* File List */}
            {attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Attached Files ({attachments.length}/5)</h4>
                {attachments.map(attachment => (
                  <div key={attachment.id} className="attachment-item">
                    <div className="file-icon">{getFileIcon(attachment.name)}</div>
                    <div className="file-info">
                      <span className="file-name" title={attachment.name}>
                        {attachment.name.length > 30 
                          ? attachment.name.substring(0, 30) + '...' 
                          : attachment.name}
                      </span>
                      <span className="file-size">{formatFileSize(attachment.size)}</span>
                      <span className="file-status">✅ Uploaded</span>
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeAttachment(attachment.id, attachment.filePath)}
                      disabled={isUploading}
                      title="Remove file"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isUploading}
        >
          {isUploading ? '🔄 Processing...' : (isEditMode ? '💾 Update Grievance' : '✅ Submit Grievance')}
        </button>
      </form>
    </div>
  );
};

export default GrievanceForm;