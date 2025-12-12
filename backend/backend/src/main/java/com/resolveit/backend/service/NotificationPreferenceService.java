package com.resolveit.backend.service;

import com.resolveit.backend.dto.NotificationPreferenceDTO;
import com.resolveit.backend.entity.NotificationPreference;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.NotificationPreferenceRepository;
import com.resolveit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationPreferenceService {
    
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    
    // Get user preferences - CHANGED: Long → String
    public NotificationPreferenceDTO getUserPreferences(String userId) {
        // First get the user by userId (String) to get their id (Long)
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User not found with userId: " + userId));
        
        NotificationPreference preferences = preferenceRepository.findByUserId(user.getId())
            .orElseGet(() -> createDefaultPreferences(user));
        
        return convertToDTO(preferences);
    }
    
    // Update user preferences - CHANGED: Long → String
    public NotificationPreferenceDTO updatePreferences(String userId, NotificationPreferenceDTO request) {
        // First get the user by userId (String) to get their id (Long)
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User not found with userId: " + userId));
        
        NotificationPreference preferences = preferenceRepository.findByUserId(user.getId())
            .orElseGet(() -> createDefaultPreferences(user));
        
        // Update fields
        preferences.setPushNotifications(request.getPushNotifications());
        preferences.setEmailNotifications(request.getEmailNotifications());
        preferences.setStatusUpdates(request.getStatusUpdates());
        preferences.setNewRemarks(request.getNewRemarks());
        preferences.setGrievanceResolved(request.getGrievanceResolved());
        preferences.setFeedbackReminders(request.getFeedbackReminders());
        
        NotificationPreference saved = preferenceRepository.save(preferences);
        return convertToDTO(saved);
    }
    
    // Create default preferences for user - CHANGED: accepts User instead of Long
    private NotificationPreference createDefaultPreferences(User user) {
        NotificationPreference preferences = NotificationPreference.builder()
            .user(user)
            .pushNotifications(true)
            .emailNotifications(true)
            .statusUpdates(true)
            .newRemarks(true)
            .grievanceResolved(true)
            .feedbackReminders(true)
            .build();
        
        return preferenceRepository.save(preferences);
    }
    
    // Convert entity to DTO
    private NotificationPreferenceDTO convertToDTO(NotificationPreference preferences) {
        return NotificationPreferenceDTO.builder()
            .pushNotifications(preferences.getPushNotifications())
            .emailNotifications(preferences.getEmailNotifications())
            .statusUpdates(preferences.getStatusUpdates())
            .newRemarks(preferences.getNewRemarks())
            .grievanceResolved(preferences.getGrievanceResolved())
            .feedbackReminders(preferences.getFeedbackReminders())
            .build();
    }
}