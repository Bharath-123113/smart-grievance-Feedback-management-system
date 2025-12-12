package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find notifications by user's userId (String like "STU001")
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(String userId);
    
    // Find unread notifications by user's userId
    List<Notification> findByUser_UserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    
    // Count unread notifications for user
    Long countByUser_UserIdAndIsReadFalse(String userId);
    
    // Find notifications by type
    List<Notification> findByUser_UserIdAndTypeOrderByCreatedAtDesc(String userId, String type);
    
    // Find notifications by grievance
    List<Notification> findByGrievanceIdOrderByCreatedAtDesc(Long grievanceId);
    
    // Mark notification as read
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id")
    void markAsRead(@Param("id") Long id, @Param("readAt") LocalDateTime readAt);
    
    // Mark all notifications as read for user by userId
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.userId = :userId AND n.isRead = false")
    void markAllAsRead(@Param("userId") String userId, @Param("readAt") LocalDateTime readAt);
    
    // Delete old notifications
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
}