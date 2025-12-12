import apiClient from './apiService';
import webSocketService from './websocketService';

const notificationService = {
  // Get all notifications for current user
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data; // Already parsed by interceptor
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0; // Return 0 on error
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Setup WebSocket for real-time notifications
  setupWebSocket: (onNotificationReceived) => {
    if (!webSocketService.client || !webSocketService.client.connected) {
      // Connect WebSocket if not already connected
      const token = localStorage.getItem('token');
      if (token) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.userId) {
          // We need to setup WebSocket for user-specific notifications
          // This depends on your backend WebSocket configuration
          console.log('Setting up WebSocket for user:', user.userId);
          
          // Add message handler for notifications
          webSocketService.addMessageHandler('notifications', {
            onMessage: (data, topic) => {
              if (data.type && onNotificationReceived) {
                onNotificationReceived(data);
              }
            }
          });
        }
      }
    }
    return webSocketService;
  },

  // Format notification for frontend (to match your UI)
  formatNotificationForUI: (notificationDTO) => {
    return {
      id: notificationDTO.id,
      type: notificationDTO.type?.toLowerCase() || 'status_update',
      title: notificationDTO.title,
      message: notificationDTO.message,
      grievance_id: notificationDTO.grievanceId,
      isRead: notificationDTO.isRead,
      timestamp: notificationDTO.createdAt, // Use createdAt
      createdAt: notificationDTO.formattedDate,
      timeAgo: notificationDTO.timeAgo
    };
  },

  // Get notification icon based on type
  getNotificationIcon: (type) => {
    const typeMap = {
      'STATUS_UPDATE': '🔄',
      'NEW_REMARK': '💬',
      'RESOLVED': '✅',
      'FEEDBACK_REQUEST': '📝',
      'REMINDER': '⏰',
      'status_update': '🔄',
      'new_remark': '💬',
      'resolved': '✅',
      'feedback_request': '📝',
      'reminder': '⏰'
    };
    return typeMap[type] || '📝';
  }
};

export default notificationService;