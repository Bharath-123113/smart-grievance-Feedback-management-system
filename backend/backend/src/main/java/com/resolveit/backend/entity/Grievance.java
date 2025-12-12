// src/main/java/com/resolveit/backend/entity/Grievance.java
package com.resolveit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "grievances")
@Data
public class Grievance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "grievance_id", unique = true, nullable = false)
    private String grievanceId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;
    
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    
    @Column(name = "category_id", nullable = false)
    private Long categoryId;
    
    @Column(name = "department_id", nullable = false)
    private Long departmentId;
    
    @Column(nullable = false)
    private String priority; // low, medium, high, urgent
    
    @Column(nullable = false)
    private String status = "submitted"; // submitted, under_review, in_progress, resolved, rejected
    
    @Column(name = "assigned_to")
    private Long assignedTo;
    
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;
    
    @Column(name = "resolved_by")
    private Long resolvedBy;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "has_attachments")
    private Boolean hasAttachments = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (grievanceId == null) {
            grievanceId = "GRV" + System.currentTimeMillis();
        }
    }
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    @Column(name = "assigned_admin_id")
    private Long assignedAdminId;
}