package com.resolveit.backend.service;

import com.resolveit.backend.dto.*;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.entity.Department;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    
    public User updateProfile(Long userId, UserProfileUpdateDTO updateDTO) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        // Update basic fields
        user.setFirstName(updateDTO.getFirstName());
        user.setLastName(updateDTO.getLastName());
        user.setEmail(updateDTO.getEmail());
        user.setPhone(updateDTO.getPhone());
        user.setDepartmentId(updateDTO.getDepartmentId());
        
        // Update student-specific fields
        user.setEnrollmentNumber(updateDTO.getEnrollmentNumber());
        user.setAddress(updateDTO.getAddress());
        user.setAcademicYear(updateDTO.getAcademicYear());
        user.setProgram(updateDTO.getProgram());
        user.setSemester(updateDTO.getSemester());
        user.setGpa(updateDTO.getGpa());
        
        return userRepository.save(user);
    }
    
    public void changePassword(Long userId, ChangePasswordDTO passwordDTO) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        // Verify current password
        if (!passwordEncoder.matches(passwordDTO.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Verify new password matches confirmation
        if (!passwordDTO.getNewPassword().equals(passwordDTO.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }
        
        // Update password
        user.setPasswordHash(passwordEncoder.encode(passwordDTO.getNewPassword()));
        userRepository.save(user);
    }
    
    public User updateNotificationPreferences(Long userId, NotificationPreferenceDTO preferencesDTO) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        user.setEmailNotifications(preferencesDTO.getEmailNotifications());
        user.setPushNotifications(preferencesDTO.getPushNotifications());
        
        return userRepository.save(user);
    }
    
    public User updateProfilePicture(Long userId, String profilePictureUrl) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        user.setProfilePictureUrl(profilePictureUrl);
        return userRepository.save(user);
    }
    
    public Map<String, Object> getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Map<String, Object> profile = new HashMap<>();
        
        // Basic info
        profile.put("id", user.getId());
        profile.put("userId", user.getUserId());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());
        profile.put("role", user.getRole());
        profile.put("departmentId", user.getDepartmentId());
        profile.put("isActive", user.getIsActive());
        profile.put("createdAt", user.getCreatedAt());
        
        // Get department name
        String departmentName = "Not specified";
        if (user.getDepartmentId() != null) {
            try {
                Department department = departmentRepository.findById(user.getDepartmentId().longValue()).orElse(null);
                if (department != null) {
                    departmentName = department.getDepartmentName();
                } else {
                    departmentName = "Department " + user.getDepartmentId();
                }
            } catch (Exception e) {
                departmentName = "Department " + user.getDepartmentId();
            }
        }
        profile.put("departmentName", departmentName);
        
        // New profile fields
        profile.put("enrollmentNumber", user.getEnrollmentNumber());
        profile.put("address", user.getAddress());
        profile.put("academicYear", user.getAcademicYear());
        profile.put("program", user.getProgram());
        profile.put("semester", user.getSemester());
        profile.put("gpa", user.getGpa());
        profile.put("profilePictureUrl", user.getProfilePictureUrl());
        profile.put("emailNotifications", user.getEmailNotifications());
        profile.put("pushNotifications", user.getPushNotifications());
        
        return profile;
    }
}