import React from 'react';

const HelpSupport = () => {
  return (
    <div className="help-support">
      <div className="help-header">
        <h1>Help & Support</h1>
        <p>Get help with using ResolveIT and contact support</p>
      </div>

      <div className="help-sections">
        {/* Quick Help */}
        <div className="help-section">
          <h2>📚 Quick Help</h2>
          <div className="help-links">
            <button className="help-link">How to submit a grievance</button>
            <button className="help-link">Tracking grievance status</button>
            <button className="help-link">Uploading attachments</button>
            <button className="help-link">Contacting faculty</button>
            <button className="help-link">Appealing decisions</button>
          </div>
        </div>

        {/* Contact Support */}
        <div className="help-section">
          <h2>📞 Contact Support</h2>
          <div className="contact-info">
            <div className="contact-item">
              <strong>IT Helpdesk:</strong> helpdesk@university.edu (555-0101)
            </div>
            <div className="contact-item">
              <strong>Grievance Cell:</strong> grievances@university.edu (555-0102)
            </div>
            <div className="contact-item">
              <strong>Department:</strong> cs-dept@university.edu (555-0103)
            </div>
            <div className="contact-item">
              <strong>Emergency:</strong> 24/7 Support Line (555-9999)
            </div>
          </div>
        </div>

        {/* Report Issue */}
        <div className="help-section">
          <h2>🐛 Report an Issue</h2>
          <div className="report-form">
            <select className="report-select">
              <option>Technical Issue</option>
              <option>Feature Request</option>
              <option>Bug Report</option>
              <option>Other</option>
            </select>
            <textarea
              className="report-textarea"
              placeholder="Describe your issue..."
              rows="4"
            ></textarea>
            <div className="report-actions">
              <button className="report-btn secondary">Attach Screenshot</button>
              <button className="report-btn primary">Submit Report</button>
            </div>
          </div>
        </div>
      </div>

      <div className="help-footer">
        <p>App Version: 2.1.0 | Last Updated: 2024-01-15</p>
      </div>
    </div>
  );
};

export default HelpSupport;