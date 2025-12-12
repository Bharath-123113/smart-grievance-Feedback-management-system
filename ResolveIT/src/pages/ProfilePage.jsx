import React, { useState, useEffect, useRef } from 'react';
import './ProfilePage.css';
import { profileApi, fileUploadApi } from '../services/apiService';

// ===== MODAL COMPONENTS =====
const EditProfileModal = ({ isOpen, onClose, onSubmit, formData, onFormChange }) => {
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>✏️ Edit Profile Information</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onFormChange}
                placeholder="+91 9876543210"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={onFormChange}
                placeholder="Enter your address"
                rows="3"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, formData, onFormChange }) => {
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>🔒 Change Password</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={onFormChange}
                placeholder="Enter current password"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={onFormChange}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={onFormChange}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Change Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NotificationsModal = ({ isOpen, onClose, onSubmit, formData, onFormChange }) => {
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>📧 Notification Preferences</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={formData.email_notifications}
                  onChange={onFormChange}
                />
                Email Notifications
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="push_notifications"
                  checked={formData.push_notifications}
                  onChange={onFormChange}
                />
                Push Notifications
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Preferences</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UploadPhotoModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  if (!isOpen) return null;
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and GIF images are allowed');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    } else {
      alert('Please select a file first');
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>📷 Upload Profile Picture</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        <div className="modal-content">
          <div className="upload-instructions">
            <p>• Max file size: 5MB</p>
            <p>• Allowed formats: JPG, PNG, GIF</p>
            <p>• Recommended: Square image (1:1 ratio)</p>
          </div>
          
          <div className="file-upload-area">
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.gif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="photo-upload"
            />
            
            <label htmlFor="photo-upload" className="file-upload-label">
              <div className="upload-icon">📁</div>
              <p>Click to select photo</p>
              <p className="file-hint">or drag and drop</p>
            </label>
            
            {selectedFile && (
              <div className="selected-file-info">
                <p><strong>Selected:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            
            {previewUrl && (
              <div className="image-preview">
                <h4>Preview:</h4>
                <img src={previewUrl} alt="Preview" className="preview-image" />
              </div>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={isUploading}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? '📤 Uploading...' : '📷 Upload Photo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN PROFILE PAGE COMPONENT =====
const ProfilePage = ({ onBack }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageError, setProfileImageError] = useState(false);
  
  // Form states
  const [editFormData, setEditFormData] = useState({
    phone: '',
    address: ''
  });
  
  const [passwordFormData, setPasswordFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [notificationFormData, setNotificationFormData] = useState({
    email_notifications: true,
    push_notifications: false
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Update profile image URL when user data changes - FIXED with better error handling
  useEffect(() => {
    const updateProfileImage = async () => {
      if (!user || !user.profilePictureUrl) {
        setProfileImageUrl('');
        setProfileImageError(false);
        return;
      }

      try {
        console.log('🔄 Processing profile picture URL:', user.profilePictureUrl);
        
        // Check if api service is available
        if (!fileUploadApi || typeof fileUploadApi.getProfilePictureFullUrl !== 'function') {
          console.error('❌ fileUploadApi or getProfilePictureFullUrl is not available');
          setProfileImageUrl('');
          return;
        }
        
        // Get the full URL
        const fullUrl = fileUploadApi.getProfilePictureFullUrl(user.profilePictureUrl);
        
        if (fullUrl) {
          console.log('✅ Generated profile image URL:', fullUrl);
          setProfileImageUrl(fullUrl);
          setProfileImageError(false);
          
          // Test if the image actually loads
          const testImage = new Image();
          testImage.onload = () => {
            console.log('✅ Profile image loads successfully');
          };
          testImage.onerror = () => {
            console.warn('⚠️ Profile image URL might be invalid:', fullUrl);
            setProfileImageError(true);
          };
          testImage.src = fullUrl;
        } else {
          console.warn('⚠️ No profile picture URL generated');
          setProfileImageUrl('');
        }
      } catch (error) {
        console.error('❌ Error generating profile image URL:', error);
        setProfileImageUrl('');
        setProfileImageError(true);
      }
    };

    updateProfileImage();
  }, [user?.profilePictureUrl]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getProfile();
      console.log('📊 Profile data received:', data);
      setUser(data);
      
      setEditFormData({
        phone: data.phone || '',
        address: data.address || ''
      });
      
      setNotificationFormData({
        email_notifications: data.emailNotifications !== false,
        push_notifications: data.pushNotifications || false
      });
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      alert('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  const getMemberSince = () => {
    if (user.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }
    return 'January 2024';
  };

  const getLastLogin = () => {
    return 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Form handlers
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationFormChange = (e) => {
    const { name, checked } = e.target;
    setNotificationFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Profile picture upload handler
  const handleProfilePictureUpload = async (file) => {
    try {
      setUploading(true);
      
      const response = await profileApi.uploadProfilePicture(file);
      console.log('✅ Profile picture upload response:', response);
      alert('Profile picture uploaded successfully!');
      
      // Refresh user data to get updated profile picture
      await fetchProfileData();
      setActiveModal(null);
      
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const profileData = {
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        email: user.email,
        phone: editFormData.phone,
        departmentId: user.departmentId || user.department_id,
        enrollmentNumber: user.enrollmentNumber || user.enrollment_number,
        address: editFormData.address,
        academicYear: user.academicYear || user.academic_year,
        program: user.program,
        semester: user.semester,
        gpa: user.gpa
      };
      
      await profileApi.updateProfile(profileData);
      alert('Profile information updated successfully!');
      fetchProfileData();
      setActiveModal(null);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Failed to update profile: ' + (error.message || 'Unknown error'));
    }
  };

  const handleChangePassword = async () => {
    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordFormData.new_password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    
    try {
      await profileApi.changePassword({
        currentPassword: passwordFormData.current_password,
        newPassword: passwordFormData.new_password,
        confirmPassword: passwordFormData.confirm_password
      });
      
      alert('Password changed successfully!');
      setPasswordFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setActiveModal(null);
    } catch (error) {
      console.error('❌ Error changing password:', error);
      alert('Failed to change password: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await profileApi.updateNotifications({
        emailNotifications: notificationFormData.email_notifications,
        pushNotifications: notificationFormData.push_notifications
      });
      
      alert('Notification preferences saved!');
      setActiveModal(null);
    } catch (error) {
      console.error('❌ Error updating notifications:', error);
      alert('Failed to save notification preferences');
    }
  };

  // Modal open handlers
  const openEditProfileModal = () => {
    setEditFormData({
      phone: user.phone || '',
      address: user.address || ''
    });
    setActiveModal('edit-profile');
  };

  const openChangePasswordModal = () => {
    setPasswordFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setActiveModal('change-password');
  };

  const openNotificationsModal = () => {
    setNotificationFormData({
      email_notifications: user.emailNotifications !== false,
      push_notifications: user.pushNotifications || false
    });
    setActiveModal('notifications');
  };

  const openUploadPhotoModal = () => {
    setActiveModal('upload-photo');
  };

  // Fallback to initials if image fails to load
  const handleImageError = (e) => {
    console.warn('⚠️ Profile image failed to load, showing initials');
    e.target.style.display = 'none';
    setProfileImageError(true);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h1>👤 My Profile</h1>
        </div>
        <div className="loading-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>👤 My Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-section">
            <h2>Profile Summary</h2>
            <div className="profile-summary">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {profileImageUrl && !profileImageError ? (
                    <img 
                      src={profileImageUrl} 
                      alt="Profile" 
                      className="profile-picture"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="avatar-initials">{getUserInitials()}</div>
                  )}
                </div>
                <button className="upload-photo-btn" onClick={openUploadPhotoModal}>
                  📷 Upload Photo
                </button>
              </div>
              <div className="profile-info">
                <div className="info-item">
                  <label>Name</label>
                  <div className="info-value">
                    {user.firstName || user.first_name} {user.lastName || user.last_name}
                  </div>
                </div>
                <div className="info-item">
                  <label>Student ID</label>
                  <div className="info-value">{user.enrollmentNumber || user.enrollment_number || 'Not set'}</div>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <div className="info-value">{user.email || 'student@university.edu'}</div>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <div className="info-value">{user.phone || 'Not provided'}</div>
                </div>
                <div className="info-item">
                  <label>Address</label>
                  <div className="info-value">{user.address || 'Not provided'}</div>
                </div>
                <div className="info-item">
                  <label>Role</label>
                  <div className="info-value role-badge">{user.role || 'Student'}</div>
                </div>
                <div className="info-item">
                  <label>Department</label>
                  <div className="info-value">{user.departmentName || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-section">
            <h2>Academic Information</h2>
            <div className="academic-info">
              <div className="info-item">
                <label>Academic Year</label>
                <div className="info-value">{user.academicYear || user.academic_year || '2024-2025'}</div>
              </div>
              <div className="info-item">
                <label>Program</label>
                <div className="info-value">{user.program || 'Bachelor of Technology'}</div>
              </div>
              <div className="info-item">
                <label>Semester</label>
                <div className="info-value">{user.semester ? `${user.semester}th Semester` : '4th Semester'}</div>
              </div>
              <div className="info-item">
                <label>Current GPA</label>
                <div className="info-value">{user.gpa ? `${user.gpa}/4.0` : '3.75/4.0'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-section">
            <h2>Account Settings</h2>
            <div className="account-actions">
              <button className="action-btn" onClick={openEditProfileModal}>
                <span className="btn-icon">✏️</span>
                Edit Profile Information
              </button>
              <button className="action-btn" onClick={openChangePasswordModal}>
                <span className="btn-icon">🔒</span>
                Change Password
              </button>
              <button className="action-btn" onClick={openNotificationsModal}>
                <span className="btn-icon">📧</span>
                Notification Preferences
              </button>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-section">
            <h2>System Information</h2>
            <div className="system-info">
              <div className="info-item">
                <label>Member Since</label>
                <div className="info-value">{getMemberSince()}</div>
              </div>
              <div className="info-item">
                <label>Last Login</label>
                <div className="info-value">{getLastLogin()}</div>
              </div>
              <div className="info-item">
                <label>Account Status</label>
                <div className="info-value status-active">Active ✅</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <EditProfileModal
        isOpen={activeModal === 'edit-profile'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleEditProfile}
        formData={editFormData}
        onFormChange={handleEditFormChange}
      />
      
      <ChangePasswordModal
        isOpen={activeModal === 'change-password'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleChangePassword}
        formData={passwordFormData}
        onFormChange={handlePasswordFormChange}
      />
      
      <NotificationsModal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleSaveNotifications}
        formData={notificationFormData}
        onFormChange={handleNotificationFormChange}
      />
      
      <UploadPhotoModal
        isOpen={activeModal === 'upload-photo'}
        onClose={() => setActiveModal(null)}
        onUpload={handleProfilePictureUpload}
        isUploading={uploading}
      />
    </div>
  );
};

export default ProfilePage;