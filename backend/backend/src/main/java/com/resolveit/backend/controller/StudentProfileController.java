package com.resolveit.backend.controller;

import com.resolveit.backend.dto.*;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.service.FileStorageService;
import com.resolveit.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard/student/profile")
@RequiredArgsConstructor
public class StudentProfileController {
    
    private final UserService userService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile() {
        Long userId = getCurrentUserId();
        Map<String, Object> profile = userService.getUserProfile(userId);
        return ResponseEntity.ok(profile);
    }
    
    @PutMapping
    public ResponseEntity<User> updateProfile(@RequestBody UserProfileUpdateDTO updateDTO) {
        Long userId = getCurrentUserId();
        User updatedUser = userService.updateProfile(userId, updateDTO);
        return ResponseEntity.ok(updatedUser);
    }
    
    @PutMapping("/password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordDTO passwordDTO) {
        Long userId = getCurrentUserId();
        userService.changePassword(userId, passwordDTO);
        return ResponseEntity.ok("Password updated successfully");
    }
    
    @PutMapping("/notifications")
    public ResponseEntity<User> updateNotifications(@RequestBody NotificationPreferenceDTO preferencesDTO) {
        Long userId = getCurrentUserId();
        User updatedUser = userService.updateNotificationPreferences(userId, preferencesDTO);
        return ResponseEntity.ok(updatedUser);
    }
    
    // REMOVE OLD ENDPOINT
    // @PutMapping("/picture")
    // public ResponseEntity<User> updateProfilePicture(@RequestBody Map<String, String> request) {
    //     Long userId = getCurrentUserId();
    //     String profilePictureUrl = request.get("profilePictureUrl");
    //     User updatedUser = userService.updateProfilePicture(userId, profilePictureUrl);
    //     return ResponseEntity.ok(updatedUser);
    // }
    
    // NEW: File upload endpoint for profile picture
    @PostMapping("/picture")
    public ResponseEntity<Map<String, Object>> uploadProfilePicture(
            @RequestParam("file") MultipartFile file) {
        
        Long userId = getCurrentUserId();
        
        try {
            // Upload file to storage
            String filePath = fileStorageService.storeFile(file, "profile-pictures");
            
            // Update user with file path
            User updatedUser = userService.updateProfilePicture(userId, filePath);
            
            // Return file info and user
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Profile picture uploaded successfully");
            response.put("filePath", filePath);
            response.put("user", updatedUser);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload profile picture: " + e.getMessage());
        }
    }
    
    // NEW: Get profile picture URL
    @GetMapping("/picture-url")
    public ResponseEntity<Map<String, String>> getProfilePictureUrl() {
        Long userId = getCurrentUserId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, String> response = new java.util.HashMap<>();
        response.put("profilePictureUrl", user.getProfilePictureUrl());
        
        return ResponseEntity.ok(response);
    }
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String username = authentication.getName();
        
        return userRepository.findByUserId(username)
            .orElseGet(() -> userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username)))
            .getId();
    }
}