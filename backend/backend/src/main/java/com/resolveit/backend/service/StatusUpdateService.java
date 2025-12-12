package com.resolveit.backend.service;

import com.resolveit.backend.dto.StatusUpdateRequest;
import com.resolveit.backend.dto.WebSocketMessage;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.GrievanceTimeline;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.GrievanceTimelineRepository;
import com.resolveit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class StatusUpdateService {
    
    private final GrievanceRepository grievanceRepository;
    private final GrievanceTimelineRepository timelineRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService; // ADDED
    private final SimpMessagingTemplate messagingTemplate;
    
    public void updateGrievanceStatus(Long grievanceId, StatusUpdateRequest request, Long updatedByUserId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        String oldStatus = grievance.getStatus();
        String newStatus = request.getStatus();
        
        validateStatus(newStatus);
        
        grievance.setStatus(newStatus);
        grievanceRepository.save(grievance);
        
        User updatedBy = userRepository.findById(updatedByUserId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        GrievanceTimeline timelineEntry = GrievanceTimeline.builder()
            .grievanceId(grievanceId)
            .status(newStatus)
            .note(request.getNote() != null ? request.getNote() : 
                  "Status updated to " + newStatus)
            .updatedBy(updatedByUserId)
            .createdAt(LocalDateTime.now())
            .build();
        
        timelineRepository.save(timelineEntry);
        
        sendStatusUpdateNotification(grievanceId, oldStatus, newStatus, updatedBy, request.getNote());
        
        // ============ ADDED: CREATE DATABASE NOTIFICATION ============
        notificationService.createStatusUpdateNotification(
            grievanceId, oldStatus, newStatus, request.getNote(), updatedBy
        );
        
        // ============ ADDED: CREATE FEEDBACK REMINDER IF RESOLVED ============
        if ("resolved".equals(newStatus)) {
            notificationService.createFeedbackReminderNotification(grievanceId);
        }
        // ====================================================================
    }
    
    private void validateStatus(String status) {
        List<String> validStatuses = List.of("submitted", "under_review", "in_progress", "resolved", "rejected");
        if (!validStatuses.contains(status)) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }
    
    private void sendStatusUpdateNotification(Long grievanceId, String oldStatus, 
                                              String newStatus, User updatedBy, String note) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("oldStatus", oldStatus);
        additionalData.put("newStatus", newStatus);
        additionalData.put("note", note != null ? note : "");
        additionalData.put("formattedTime", LocalDateTime.now().format(formatter));
        additionalData.put("updatedBy", updatedBy.getFirstName() + " " + updatedBy.getLastName());
        
        WebSocketMessage message = WebSocketMessage.builder()
            .type("STATUS_UPDATE")
            .grievanceId(grievanceId)
            .remark(null)
            .sender(updatedBy.getFirstName() + " " + updatedBy.getLastName())
            .timestamp(LocalDateTime.now())
            .additionalData(additionalData)
            .build();
        
        messagingTemplate.convertAndSend("/topic/grievance/" + grievanceId, message);
    }
    
    public List<GrievanceTimeline> getGrievanceTimeline(Long grievanceId) {
        return timelineRepository.findByGrievanceIdOrderByCreatedAtAsc(grievanceId);
    }
    
    public List<GrievanceTimeline> getGrievanceTimelineForStudent(Long grievanceId, Long studentId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        if (!grievance.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized access to grievance timeline");
        }
        
        return timelineRepository.findByGrievanceIdOrderByCreatedAtAsc(grievanceId);
    }
}