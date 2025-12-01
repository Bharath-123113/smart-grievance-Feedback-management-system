import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

const Header = ({
  user,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
  notifications = [],
  unreadCount = 0,
  onNotificationView,
  onViewAllNotifications,
  onMarkNotificationAsRead,
  onViewProfile // ADD THIS NEW PROP
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileToggle = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    setNotificationDropdownOpen(false);
  };

  const handleNotificationToggle = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setProfileDropdownOpen(false);
  };

  const handleNotificationClick = (notification) => {
    if (onMarkNotificationAsRead) {
      onMarkNotificationAsRead(notification.id);
    }
    if (onNotificationView) {
      onNotificationView(notification.grievance_id);
    }
    setNotificationDropdownOpen(false);
  };

  const handleViewAllNotifications = () => {
    if (onViewAllNotifications) {
      onViewAllNotifications();
    }
    setNotificationDropdownOpen(false);
  };

  // ADD THIS NEW FUNCTION FOR PROFILE NAVIGATION
  const handleProfileClick = () => {
    setProfileDropdownOpen(false);
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'status_update': return '🔄';
      case 'reminder': return '⏰';
      case 'resolved': return '✅';
      case 'new_response': return '💬';
      default: return '📝';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now - notificationTime) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const recentNotifications = notifications.slice(0, 3);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
          onClick={onToggleSidebar}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="logo">
          <span className="logo-icon">🔺</span>
          <span className="logo-text">ResolveIT</span>
        </div>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="notification-container" ref={notificationRef}>
          <button
            className={`notification-btn ${unreadCount > 0 ? 'has-notifications' : ''}`}
            onClick={handleNotificationToggle}
          >
            <span className="notification-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {notificationDropdownOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <span className="unread-count">{unreadCount} unread</span>
                )}
              </div>

              <div className="notification-list">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {notification.title}
                        </div>
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-time">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                      <button
                        className="view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    No new notifications
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notification-footer">
                  <button
                    className="view-all-btn"
                    onClick={handleViewAllNotifications}
                  >
                    📬 View All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="profile-container" ref={profileRef}>
          <button className="profile-btn" onClick={handleProfileToggle}>
            <span className="profile-icon">👤</span>
            <span className="profile-name">{user.first_name}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {profileDropdownOpen && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <div className="profile-name">{user.first_name} {user.last_name}</div>
                <div className="profile-role">Student</div>
              </div>
              <div className="dropdown-divider"></div>
              {/* UPDATE THIS BUTTON TO USE THE NEW FUNCTION */}
              <button className="dropdown-item" onClick={handleProfileClick}>
                <span className="item-icon">👤</span>
                My Profile
              </button>
              <button className="dropdown-item logout-btn" onClick={onLogout}>
                <span className="item-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;