import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, user, activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'my-grievances', label: 'My Grievances', icon: '📋' },
    { id: 'track-grievance', label: 'Track Grievance', icon: '🔍' },
    { id: 'new-grievance', label: 'Submit Grievance', icon: '📝' },
    { id: 'quick-stats', label: 'Quick Stats', icon: '📊' },
    { type: 'divider' },
    { id: 'privacy-security', label: 'Privacy & Security', icon: '🛡️' },
    { id: 'help-support', label: 'Help & Support', icon: '❓' },
  ];

  const handleMenuClick = (itemId) => {
    setActiveView(itemId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h3>{user.first_name} {user.last_name}</h3>
              <p>Student • {user.department || 'Computer Science'}</p>
            </div>
          </div>
          <button className="close-sidebar" onClick={onClose}>×</button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`divider-${index}`} className="nav-divider"></div>;
            }

            return (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="app-info">
            <p>ResolveIT v2.1.0</p>
            <span>Smart Grievance Management</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;