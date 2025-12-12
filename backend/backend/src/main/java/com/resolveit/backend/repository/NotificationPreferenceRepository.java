package com.resolveit.backend.repository;

import com.resolveit.backend.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    
    // Find preference by user ID (Long - primary key)
    Optional<NotificationPreference> findByUserId(Long userId);
    
    // Find preference by user's userId (String like "STU001")
    @Query("SELECT np FROM NotificationPreference np WHERE np.user.userId = :userId")
    Optional<NotificationPreference> findByUserUserId(@Param("userId") String userId);
    
    // Check if user has a specific preference enabled
    @Query("SELECT np.pushNotifications FROM NotificationPreference np WHERE np.user.userId = :userId")
    Boolean isPushEnabled(@Param("userId") String userId);
    
    @Query("SELECT np.emailNotifications FROM NotificationPreference np WHERE np.user.userId = :userId")
    Boolean isEmailEnabled(@Param("userId") String userId);
    
    @Query("SELECT np.statusUpdates FROM NotificationPreference np WHERE np.user.userId = :userId")
    Boolean isStatusUpdatesEnabled(@Param("userId") String userId);
    
    @Query("SELECT np.newRemarks FROM NotificationPreference np WHERE np.user.userId = :userId")
    Boolean isNewRemarksEnabled(@Param("userId") String userId);
    
    @Query("SELECT np.grievanceResolved FROM NotificationPreference np WHERE np.user.userId = :userId")
    Boolean isGrievanceResolvedEnabled(@Param("userId") String userId);
    
    @Query("SELECT np.feedbackReminders FROM NotificationPreference np WHERE np.user.userId = :userId")
    Boolean isFeedbackRemindersEnabled(@Param("userId") String userId);
}