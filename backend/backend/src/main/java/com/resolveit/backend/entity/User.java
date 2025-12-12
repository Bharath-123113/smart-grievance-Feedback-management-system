package com.resolveit.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", unique = true, nullable = false)
    private String userId;
    
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @Column(name = "last_name", nullable = false)
    private String lastName;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(nullable = false)
    private String role;
    
    @Column(name = "department_id")
    private Integer departmentId;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    @Column(name = "enrollment_number", length = 50)
    private String enrollmentNumber;
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    @Column(name = "program", length = 100)
    private String program;
    @Column(name = "semester")
    private Integer semester;
    @Column(name = "gpa", precision = 3, scale = 2)
    private BigDecimal gpa;  // Or Double if you prefer
    @Column(name = "profile_picture_url")
    private String profilePictureUrl;
    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;
    @Column(name = "push_notifications")
    private Boolean pushNotifications = false;


}