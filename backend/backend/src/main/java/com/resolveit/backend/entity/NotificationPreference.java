package com.resolveit.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {
    @Id
    private Long userId;
    
    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "push_notifications")
    @Builder.Default
    private Boolean pushNotifications = true;
    
    @Column(name = "email_notifications")
    @Builder.Default
    private Boolean emailNotifications = true;
    
    @Column(name = "status_updates")
    @Builder.Default
    private Boolean statusUpdates = true;
    
    @Column(name = "new_remarks")
    @Builder.Default
    private Boolean newRemarks = true;
    
    @Column(name = "grievance_resolved")
    @Builder.Default
    private Boolean grievanceResolved = true;
    
    @Column(name = "feedback_reminders")
    @Builder.Default
    private Boolean feedbackReminders = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}