package com.resolveit.backend.controller;

import com.resolveit.backend.dto.ApiResponse;
import com.resolveit.backend.dto.NotificationPreferenceDTO;
import com.resolveit.backend.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {
    
    private final NotificationPreferenceService preferenceService;
    
    // Get user's notification preferences
    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPreferenceDTO>> getPreferences(
            @AuthenticationPrincipal String userId) {  // Changed from Long to String
        
        NotificationPreferenceDTO preferences = preferenceService.getUserPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success(preferences));
    }
    
    // Update notification preferences
    @PutMapping
    public ResponseEntity<ApiResponse<NotificationPreferenceDTO>> updatePreferences(
            @RequestBody NotificationPreferenceDTO request,
            @AuthenticationPrincipal String userId) {  // Changed from Long to String
        
        NotificationPreferenceDTO updated = preferenceService.updatePreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully", updated));
    }
}