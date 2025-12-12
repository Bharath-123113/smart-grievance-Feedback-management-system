package com.resolveit.backend.service;

import com.resolveit.backend.dto.RemarkRequestDTO;
import com.resolveit.backend.dto.RemarkResponseDTO;
import com.resolveit.backend.dto.WebSocketMessage;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.Remark;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.RemarkRepository;
import com.resolveit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RemarkService {
    
    private final RemarkRepository remarkRepository;
    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    
    public RemarkResponseDTO addRemark(Long grievanceId, RemarkRequestDTO request, Long userId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new RuntimeException("Grievance not found with ID: " + grievanceId));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        // IMPORTANT: user.getRole() returns lowercase like "student", "staff"
        // Database constraint only accepts lowercase
        Remark remark = Remark.builder()
            .grievance(grievance)
            .user(user)
            .message(request.getMessage().trim())
            .userType(user.getRole()) // Keep as lowercase: "student", "staff", etc.
            .isInternal(request.getIsInternal() != null ? request.getIsInternal() : false)
            .createdAt(LocalDateTime.now())
            .build();
        
        Remark savedRemark = remarkRepository.save(remark);
        RemarkResponseDTO response = convertToResponseDTO(savedRemark);
        
        sendWebSocketNotification(grievanceId, response, user);
        
        // Create notification if remark is not internal
        if (!remark.getIsInternal()) {
            createRemarkNotification(grievance, user, remark.getMessage());
        }
        
        return response;
    }
    
    // FIXED: Send notification to the RIGHT person
    private void createRemarkNotification(Grievance grievance, User sender, String message) {
        // Roles are lowercase in DB: "student", "staff", "admin", etc.
        String role = sender.getRole().toLowerCase().trim();
        
        if (role.equals("student")) {
            // Student added remark → Notify ASSIGNED STAFF
            if (grievance.getAssignedTo() != null) {
                User assignedStaff = userRepository.findById(grievance.getAssignedTo()).orElse(null);
                if (assignedStaff != null) {
                    String title = "Student Added Remark";
                    String notificationMessage = String.format("Student %s %s added a remark to grievance '%s': %s",
                        sender.getFirstName(), 
                        sender.getLastName(), 
                        grievance.getTitle(),
                        message.length() > 50 ? message.substring(0, 50) + "..." : message);
                    
                    notificationService.createNotification(
                        assignedStaff.getUserId(), // Send to staff
                        "NEW_REMARK",
                        title,
                        notificationMessage,
                        grievance.getId()
                    );
                    return; // IMPORTANT: Exit after sending to staff
                }
            }
            // If no staff assigned, log (optional)
            System.out.println("No staff assigned for grievance " + grievance.getId() + ". No notification sent.");
            
        } else {
            // Staff/Admin added remark → Notify STUDENT
            String title = "New Remark Added";
            String notificationMessage = String.format("%s %s added a remark to your grievance '%s': %s",
                sender.getFirstName(), 
                sender.getLastName(), 
                grievance.getTitle(),
                message.length() > 50 ? message.substring(0, 50) + "..." : message);
            
            // Get the student user to get their userId (String)
            User student = userRepository.findById(grievance.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + grievance.getStudentId()));
            
            notificationService.createNotification(
                student.getUserId(), // Send to student
                "NEW_REMARK",
                title,
                notificationMessage,
                grievance.getId()
            );
        }
    }
    
    private void sendWebSocketNotification(Long grievanceId, RemarkResponseDTO remark, User sender) {
        WebSocketMessage message = WebSocketMessage.createNewRemarkMessage(
            grievanceId, remark, sender.getFirstName() + " " + sender.getLastName()
        );
        
        messagingTemplate.convertAndSend("/topic/grievance/" + grievanceId, message);
    }
    
    public List<RemarkResponseDTO> getRemarksForGrievance(Long grievanceId, boolean includeInternal) {
        if (!grievanceRepository.existsById(grievanceId)) {
            throw new RuntimeException("Grievance not found with ID: " + grievanceId);
        }
        
        List<Remark> remarks;
        if (includeInternal) {
            remarks = remarkRepository.findByGrievanceIdOrderByCreatedAtDesc(grievanceId);
        } else {
            remarks = remarkRepository.findVisibleRemarks(grievanceId);
        }
        
        return remarks.stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }
    
    public List<RemarkResponseDTO> getRemarksForStudent(Long grievanceId, Long studentId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        if (!grievance.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized access to grievance");
        }
        
        List<Remark> remarks = remarkRepository.findVisibleRemarks(grievanceId);
        
        return remarks.stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }
    
    public Long getRemarksCount(Long grievanceId) {
        return remarkRepository.countByGrievanceId(grievanceId);
    }
    
    public RemarkResponseDTO getLatestRemark(Long grievanceId) {
        Remark remark = remarkRepository.findFirstByGrievanceIdOrderByCreatedAtDesc(grievanceId);
        if (remark != null) {
            return convertToResponseDTO(remark);
        }
        return null;
    }
    
    private RemarkResponseDTO convertToResponseDTO(Remark remark) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
        
        return RemarkResponseDTO.builder()
            .id(remark.getId())
            .message(remark.getMessage())
            .userName(remark.getUser().getFirstName() + " " + remark.getUser().getLastName())
            .userType(remark.getUserType()) // This will be lowercase: "student", "staff", etc.
            .isInternal(remark.getIsInternal())
            .createdAt(remark.getCreatedAt())
            .formattedTime(remark.getCreatedAt().format(formatter))
            .build();
    }
}