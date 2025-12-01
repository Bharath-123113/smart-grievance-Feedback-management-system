import React from 'react';

const PrivacySecurity = ({ user }) => {
  return (
    <div className="privacy-security">
      <div className="privacy-header">
        <h1>Privacy & Security</h1>
        <p>Manage your account security and privacy settings</p>
      </div>

      <div className="privacy-sections">
        {/* Account Security */}
        <div className="privacy-section">
          <h2>🔒 Account Security</h2>
          <div className="security-info">
            <p><strong>Last Login:</strong> 2 hours ago from Delhi, India</p>
            <p><strong>Device:</strong> Chrome on Windows 11</p>
          </div>
          <div className="security-actions">
            <button className="security-btn">Change Password</button>
            <button className="security-btn">Enable Two-Factor Auth</button>
            <button className="security-btn">Logout All Devices</button>
          </div>
        </div>

        {/* Data Privacy */}
        <div className="privacy-section">
          <h2>🛡️ Data Privacy</h2>
          <div className="privacy-options">
            <label className="privacy-option">
              <input type="checkbox" defaultChecked />
              <span>Show my name in public grievances</span>
            </label>
            <label className="privacy-option">
              <input type="checkbox" />
              <span>Allow department to contact me</span>
            </label>
            <label className="privacy-option">
              <input type="checkbox" defaultChecked />
              <span>Anonymize my grievances where possible</span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="privacy-section">
          <h2>📊 Data Management</h2>
          <div className="data-stats">
            <p>Stored Data: <strong>2.3 MB used</strong></p>
            <p>Grievance History: <strong>12 records</strong></p>
            <p>Attachments: <strong>5 files (15 MB)</strong></p>
          </div>
          <div className="data-actions">
            <button className="data-btn">Download My Data</button>
            <button className="data-btn">Clear Cache</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySecurity;