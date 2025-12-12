package com.resolveit.backend.service;

import com.resolveit.backend.dto.NotificationDTO;
import com.resolveit.backend.entity.*;
import com.resolveit.backend.repository.NotificationRepository;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final GrievanceRepository grievanceRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
    
    // ============ NEW METHODS FOR DASHBOARDS ============
    
    // For admin dashboard - notify admin when they assign grievance to themselves
    public void notifyGrievanceAssigned(Grievance grievance, User admin) {
        String title = "Grievance Assigned to You";
        String message = String.format("You have been assigned grievance #%s: '%s'", 
            grievance.getGrievanceId(), grievance.getTitle());
        
        createNotification(admin.getUserId(), "GRIEVANCE_ASSIGNED", title, message, grievance.getId());
    }
    
    // For admin dashboard - notify staff when admin assigns grievance to them
    public void notifyStaffAssignment(Grievance grievance, User staff) {
        String title = "New Grievance Assignment";
        String message = String.format("You have been assigned grievance #%s: '%s' by admin", 
            grievance.getGrievanceId(), grievance.getTitle());
        
        createNotification(staff.getUserId(), "GRIEVANCE_ASSIGNED", title, message, grievance.getId());
    }
    
    // For staff dashboard - notify student when status is updated
    public void notifyStatusUpdate(Grievance grievance) {
        // Get student by their ID to get their userId (String)
        User student = userRepository.findById(grievance.getStudentId())
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + grievance.getStudentId()));
        
        String title = "Grievance Status Updated";
        String message = String.format("Your grievance #%s: '%s' status has been updated to '%s'", 
            grievance.getGrievanceId(), grievance.getTitle(), grievance.getStatus());
        
        createNotification(student.getUserId(), "STATUS_UPDATE", title, message, grievance.getId());
    }
    
    // ============ EXISTING METHODS ============
    
    // Get all notifications for user
    public List<NotificationDTO> getUserNotifications(String userId) {
        List<Notification> notifications = notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Get unread notifications for user
    public List<NotificationDTO> getUnreadNotifications(String userId) {
        List<Notification> notifications = notificationRepository.findByUser_UserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notifications.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Get notification count
    public Long getUnreadCount(String userId) {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(userId);
    }
    
    // Mark notification as read
    public void markAsRead(Long notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to mark this notification as read");
        }
        
        notificationRepository.markAsRead(notificationId, LocalDateTime.now());
    }
    
    // Mark all notifications as read
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }
    
    // Delete notification
    public void deleteNotification(Long notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this notification");
        }
        
        notificationRepository.delete(notification);
    }
    
    // Create notification (for internal use)
    public void createNotification(String userId, String type, String title, String message, Long grievanceId) {
        // Check user preferences
        if (!shouldSendNotification(userId, type)) {
            return;
        }
        
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User not found with userId: " + userId));
        
        Grievance grievance = null;
        if (grievanceId != null) {
            grievance = grievanceRepository.findById(grievanceId).orElse(null);
        }
        
        Notification notification = Notification.builder()
            .user(user)
            .type(type)
            .title(title)
            .message(message)
            .grievance(grievance)
            .isRead(false)
            .createdAt(LocalDateTime.now())
            .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        
        // Send WebSocket notification
        sendWebSocketNotification(userId, convertToDTO(savedNotification));
    }
    
    // Create status update notification
    public void createStatusUpdateNotification(Long grievanceId, String oldStatus, String newStatus, String note, User updatedBy) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Get student by their ID to get their userId (String)
        User student = userRepository.findById(grievance.getStudentId())
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + grievance.getStudentId()));
        
        String title = "Status Updated";
        String message = String.format("Your grievance '%s' status changed from %s to %s. %s",
            grievance.getTitle(), oldStatus, newStatus, note != null ? "Note: " + note : "");
        
        createNotification(student.getUserId(), "STATUS_UPDATE", title, message, grievanceId);
    }
    
    // Create feedback reminder notification
    public void createFeedbackReminderNotification(Long grievanceId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Get student by their ID to get their userId (String)
        User student = userRepository.findById(grievance.getStudentId())
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + grievance.getStudentId()));
        
        String title = "Feedback Request";
        String message = String.format("Your grievance '%s' has been resolved. Please share your feedback to help us improve.",
            grievance.getTitle());
        
        createNotification(student.getUserId(), "FEEDBACK_REQUEST", title, message, grievanceId);
    }
    
    // Check if should send notification based on preferences
    private boolean shouldSendNotification(String userId, String type) {
        return preferenceRepository.findByUserUserId(userId)
            .map(preferences -> {
                switch (type) {
                    case "STATUS_UPDATE":
                        return preferences.getStatusUpdates();
                    case "NEW_REMARK":
                        return preferences.getNewRemarks();
                    case "RESOLVED":
                        return preferences.getGrievanceResolved();
                    case "FEEDBACK_REQUEST":
                        return preferences.getFeedbackReminders();
                    case "GRIEVANCE_ASSIGNED":
                        return preferences.getStatusUpdates(); // Use status updates for assignments
                    default:
                        return true;
                }
            })
            .orElse(true); // Default to true if preferences not found
    }
    
    // Send WebSocket notification
    private void sendWebSocketNotification(String userId, NotificationDTO notification) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/notifications",
            notification
        );
    }
    
    // Convert entity to DTO
    private NotificationDTO convertToDTO(Notification notification) {
        String timeAgo = getTimeAgo(notification.getCreatedAt());
        
        return NotificationDTO.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .grievanceId(notification.getGrievance() != null ? notification.getGrievance().getId() : null)
            .grievanceTitle(notification.getGrievance() != null ? notification.getGrievance().getTitle() : null)
            .isRead(notification.getIsRead())
            .createdAt(notification.getCreatedAt())
            .readAt(notification.getReadAt())
            .timeAgo(timeAgo)
            .formattedDate(notification.getCreatedAt().format(formatter))
            .build();
    }
    
    // Get time ago string
    private String getTimeAgo(LocalDateTime dateTime) {
        long minutes = ChronoUnit.MINUTES.between(dateTime, LocalDateTime.now());
        
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " min ago";
        
        long hours = ChronoUnit.HOURS.between(dateTime, LocalDateTime.now());
        if (hours < 24) return hours + " hour ago";
        
        long days = ChronoUnit.DAYS.between(dateTime, LocalDateTime.now());
        if (days < 7) return days + " day ago";
        
        return dateTime.format(DateTimeFormatter.ofPattern("MMM dd"));
    }
}