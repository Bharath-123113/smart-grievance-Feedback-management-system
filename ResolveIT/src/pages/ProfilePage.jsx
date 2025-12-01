import React, { useState } from 'react';
import './ProfilePage.css';

const ProfilePage = ({ user, onBack }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    address: user.address || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    email_notifications: true,
    push_notifications: false,
    privacy_public: false
  });

  const getUserInitials = () => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const getMemberSince = () => {
    return user.registration_date ? new Date(user.registration_date).toLocaleDateString() : 'January 2024';
  };

  const getLastLogin = () => {
    return 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditProfile = () => {
    alert('Profile information updated successfully!');
    setActiveModal(null);
  };

  const handleChangePassword = () => {
    if (formData.new_password !== formData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }
    if (formData.new_password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    alert('Password changed successfully!');
    setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
    setActiveModal(null);
  };

  const handleSaveNotifications = () => {
    alert('Notification preferences saved!');
    setActiveModal(null);
  };

  const handleSavePrivacy = () => {
    alert('Privacy settings updated!');
    setActiveModal(null);
  };

  const EditProfileModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>✏️ Edit Profile Information</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 9876543210"
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your address"
              rows="3"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleEditProfile}>Save Changes</button>
        </div>
      </div>
    </div>
  );

  const ChangePasswordModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>🔒 Change Password</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleInputChange}
              placeholder="Enter current password"
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleInputChange}
              placeholder="Enter new password"
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleChangePassword}>Change Password</button>
        </div>
      </div>
    </div>
  );

  const NotificationsModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>📧 Notification Preferences</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
        </div>
        <div className="modal-content">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="email_notifications"
                checked={formData.email_notifications}
                onChange={handleInputChange}
              />
              Email Notifications
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="push_notifications"
                checked={formData.push_notifications}
                onChange={handleInputChange}
              />
              Push Notifications
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleSaveNotifications}>Save Preferences</button>
        </div>
      </div>
    </div>
  );

  const PrivacyModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>🌐 Privacy Settings</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
        </div>
        <div className="modal-content">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="privacy_public"
                checked={formData.privacy_public}
                onChange={handleInputChange}
              />
              Make profile public to other students
            </label>
          </div>
          <p className="modal-description">
            When enabled, other students in your department can view your basic profile information.
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleSavePrivacy}>Save Settings</button>
        </div>
      </div>
    </div>
  );

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
                  {getUserInitials()}
                </div>
                <button className="upload-photo-btn" onClick={() => alert('Photo upload feature will be available soon!')}>
                  📷 Upload Photo
                </button>
              </div>
              <div className="profile-info">
                <div className="info-item">
                  <label>Name</label>
                  <div className="info-value">{user.first_name} {user.last_name}</div>
                </div>
                <div className="info-item">
                  <label>Student ID</label>
                  <div className="info-value">{user.student_id || 'Not set'}</div>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <div className="info-value">{user.email || 'student@university.edu'}</div>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <div className="info-value">{user.phone || 'Not provided'}</div>
                </div>
                {/* ADD ADDRESS FIELD */}
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
                  <div className="info-value">{user.department || 'Not specified'}</div>
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
                <div className="info-value">{user.academic_year || '2024-2025'}</div>
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
              <button className="action-btn" onClick={() => setActiveModal('edit-profile')}>
                <span className="btn-icon">✏️</span>
                Edit Profile Information
              </button>
              <button className="action-btn" onClick={() => setActiveModal('change-password')}>
                <span className="btn-icon">🔒</span>
                Change Password
              </button>
              <button className="action-btn" onClick={() => setActiveModal('notifications')}>
                <span className="btn-icon">📧</span>
                Notification Preferences
              </button>
              <button className="action-btn" onClick={() => setActiveModal('privacy')}>
                <span className="btn-icon">🌐</span>
                Privacy Settings
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

      {activeModal === 'edit-profile' && <EditProfileModal />}
      {activeModal === 'change-password' && <ChangePasswordModal />}
      {activeModal === 'notifications' && <NotificationsModal />}
      {activeModal === 'privacy' && <PrivacyModal />}
    </div>
  );
};

export default ProfilePage;