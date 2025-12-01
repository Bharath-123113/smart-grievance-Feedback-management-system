import React from 'react';
import './NotificationsPage.css';

const NotificationsPage = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onViewGrievance,
  onBack
}) => {
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
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return notificationTime.toLocaleDateString();
  };

  const groupNotificationsByDate = () => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.timestamp);

      if (notificationDate.toDateString() === now.toDateString()) {
        groups.today.push(notification);
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(notification);
      } else if (notificationDate > weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification) => {
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (onViewGrievance) {
      onViewGrievance(notification.grievance_id);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>🔔 All Notifications</h1>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={onMarkAllAsRead}>
              Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="clear-all-btn" onClick={onClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="notifications-container">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <h3>No Notifications</h3>
            <p>You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          <div className="notifications-groups">
            {groupedNotifications.today.length > 0 && (
              <div className="notification-group">
                <h3 className="group-title">📝 Today</h3>
                {groupedNotifications.today.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
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
                ))}
              </div>
            )}

            {groupedNotifications.yesterday.length > 0 && (
              <div className="notification-group">
                <h3 className="group-title">📝 Yesterday</h3>
                {groupedNotifications.yesterday.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
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
                ))}
              </div>
            )}

            {groupedNotifications.thisWeek.length > 0 && (
              <div className="notification-group">
                <h3 className="group-title">📝 This Week</h3>
                {groupedNotifications.thisWeek.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
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
                ))}
              </div>
            )}

            {groupedNotifications.older.length > 0 && (
              <div className="notification-group">
                <h3 className="group-title">📝 Older</h3>
                {groupedNotifications.older.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;