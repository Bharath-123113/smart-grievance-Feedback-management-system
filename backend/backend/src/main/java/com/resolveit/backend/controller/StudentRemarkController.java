package com.resolveit.backend.controller;

import com.resolveit.backend.dto.*;
import com.resolveit.backend.entity.*;
import com.resolveit.backend.repository.*;
import com.resolveit.backend.service.RemarkService;
import com.resolveit.backend.service.StatusUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard/student")
@RequiredArgsConstructor
public class StudentRemarkController {
    
    private final RemarkService remarkService;
    private final UserRepository userRepository;
    private final GrievanceRepository grievanceRepository;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;
    private final GrievanceTimelineRepository grievanceTimelineRepository;
    private final StatusUpdateService statusUpdateService;
    
    @PostMapping("/grievances/{grievanceId}/remarks")
    public ResponseEntity<RemarkResponseDTO> addRemark(
            @PathVariable Long grievanceId,
            @RequestBody RemarkRequestDTO request) {
        
        Long studentId = getCurrentUserId();
        RemarkResponseDTO response = remarkService.addRemark(grievanceId, request, studentId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/grievances/{grievanceId}/remarks")
    public ResponseEntity<List<RemarkResponseDTO>> getRemarks(
            @PathVariable Long grievanceId) {
        
        Long studentId = getCurrentUserId();
        List<RemarkResponseDTO> remarks = remarkService.getRemarksForStudent(grievanceId, studentId);
        return ResponseEntity.ok(remarks);
    }
    
    @GetMapping("/grievances/{grievanceId}/remarks/count")
    public ResponseEntity<Long> getRemarksCount(@PathVariable Long grievanceId) {
        Long studentId = getCurrentUserId();
        remarkService.getRemarksForStudent(grievanceId, studentId);
        Long count = remarkService.getRemarksCount(grievanceId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/grievances/{grievanceId}/remarks/latest")
    public ResponseEntity<RemarkResponseDTO> getLatestRemark(@PathVariable Long grievanceId) {
        Long studentId = getCurrentUserId();
        remarkService.getRemarksForStudent(grievanceId, studentId);
        RemarkResponseDTO latestRemark = remarkService.getLatestRemark(grievanceId);
        return ResponseEntity.ok(latestRemark);
    }

    @GetMapping("/grievances/{grievanceId}/timeline")
    public ResponseEntity<List<GrievanceTimelineDTO>> getGrievanceTimeline(
            @PathVariable Long grievanceId) {
    
        Long studentId = getCurrentUserId();
        
        List<GrievanceTimeline> timeline = statusUpdateService
            .getGrievanceTimelineForStudent(grievanceId, studentId);
        
        List<GrievanceTimelineDTO> response = timeline.stream()
            .map(this::convertToTimelineDTO)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    // PERMANENT: Track grievance by grievance_id (string like "GRV-001")
    @GetMapping("/track/{grievanceId}")
    public ResponseEntity<Map<String, Object>> trackGrievanceById(
            @PathVariable String grievanceId) {
        
        Long studentId = getCurrentUserId();
        
        // 1. Find grievance by grievance_id (string like "GRV-001") - FIXED
        Grievance grievance = grievanceRepository.findByGrievanceId(grievanceId);
        
        if (grievance == null) {
            throw new RuntimeException("Grievance not found with ID: " + grievanceId);
        }
        
        // 2. Verify student owns this grievance
        if (!grievance.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized: You don't have access to this grievance");
        }
        
        // 3. Get timeline entries
        List<GrievanceTimeline> timeline = grievanceTimelineRepository
            .findByGrievanceIdOrderByCreatedAtAsc(grievance.getId());
        
        // 4. Get category and department names
        String categoryName = getCategoryName(grievance.getCategoryId());
        String departmentName = getDepartmentName(grievance.getDepartmentId());
        
        // 5. Get assigned staff name
        String assignedToName = getAssignedStaffName(grievance.getAssignedTo());
        
        // 6. Convert timeline to response format
        List<Map<String, Object>> timelineDTO = convertTimelineToDTO(timeline);
        
        // 7. Prepare response
        Map<String, Object> response = buildGrievanceResponse(grievance, categoryName, departmentName, assignedToName, timelineDTO);
        
        return ResponseEntity.ok(response);
    }
    
    // Helper method: Get category name
    private String getCategoryName(Long categoryId) {
        if (categoryId == null) return "Unknown";
        try {
            Optional<Category> category = categoryRepository.findById(categoryId);
            return category.map(Category::getCategoryName).orElse("Unknown");
        } catch (Exception e) {
            return "Unknown";
        }
    }
    
    // Helper method: Get department name
    private String getDepartmentName(Long departmentId) {
        if (departmentId == null) return "Unknown";
        try {
            Optional<Department> department = departmentRepository.findById(departmentId);
            return department.map(Department::getDepartmentName).orElse("Unknown");
        } catch (Exception e) {
            return "Unknown";
        }
    }
    
    // Helper method: Get assigned staff name
    private String getAssignedStaffName(Long staffId) {
        if (staffId == null) return "Not assigned";
        try {
            Optional<User> assignedUser = userRepository.findById(staffId);
            return assignedUser
                .map(user -> user.getFirstName() + " " + user.getLastName())
                .orElse("Not assigned");
        } catch (Exception e) {
            return "Not assigned";
        }
    }
    
    // Helper method: Convert timeline to DTO
    private List<Map<String, Object>> convertTimelineToDTO(List<GrievanceTimeline> timeline) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
        
        return timeline.stream()
            .map(entry -> {
                Map<String, Object> entryMap = new HashMap<>();
                entryMap.put("id", entry.getId());
                entryMap.put("status", entry.getStatus());
                entryMap.put("note", entry.getNote());
                entryMap.put("created_at", entry.getCreatedAt());
                entryMap.put("formatted_date", entry.getCreatedAt().format(formatter));
                
                // Get who updated
                String updatedByName = "System";
                if (entry.getUpdatedBy() != null) {
                    try {
                        Optional<User> user = userRepository.findById(entry.getUpdatedBy());
                        if (user.isPresent()) {
                            updatedByName = user.get().getFirstName() + " " + user.get().getLastName();
                        }
                    } catch (Exception e) {
                        // Keep default
                    }
                }
                entryMap.put("updated_by_name", updatedByName);
                
                return entryMap;
            })
            .collect(Collectors.toList());
    }
    
    // Helper method: Build grievance response
    private Map<String, Object> buildGrievanceResponse(Grievance grievance, 
                                                       String categoryName, 
                                                       String departmentName,
                                                       String assignedToName,
                                                       List<Map<String, Object>> timelineDTO) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", grievance.getId());
        response.put("grievance_id", grievance.getGrievanceId());
        response.put("title", grievance.getTitle());
        response.put("description", grievance.getDescription());
        response.put("category_id", grievance.getCategoryId());
        response.put("category_name", categoryName);
        response.put("department_id", grievance.getDepartmentId());
        response.put("department_name", departmentName);
        response.put("priority", grievance.getPriority());
        response.put("status", grievance.getStatus());
        response.put("created_at", grievance.getCreatedAt());
        response.put("assigned_to", grievance.getAssignedTo());
        response.put("assigned_to_name", assignedToName);
        response.put("has_attachments", grievance.getHasAttachments() != null ? grievance.getHasAttachments() : false);
        response.put("status_timeline", timelineDTO);
        
        // Format created_at date
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
        if (grievance.getCreatedAt() != null) {
            response.put("formatted_created_at", grievance.getCreatedAt().format(formatter));
        }
        
        return response;
    }
    
    private GrievanceTimelineDTO convertToTimelineDTO(GrievanceTimeline timeline) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
        String updatedByName = "System";
        
        if (timeline.getUpdatedBy() != null) {
            try {
                Optional<User> user = userRepository.findById(timeline.getUpdatedBy());
                if (user.isPresent()) {
                    updatedByName = user.get().getFirstName() + " " + user.get().getLastName();
                }
            } catch (Exception e) {
                // Keep default
            }
        }
        
        return GrievanceTimelineDTO.builder()
            .id(timeline.getId())
            .status(timeline.getStatus())
            .note(timeline.getNote())
            .updatedByName(updatedByName)
            .createdAt(timeline.getCreatedAt())
            .formattedTime(timeline.getCreatedAt().format(formatter))
            .build();
    }
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String username = authentication.getName();
        
        // FIXED: Handle Optional properly
        Optional<User> userByUserId = userRepository.findByUserId(username);
        if (userByUserId.isPresent()) {
            return userByUserId.get().getId();
        }
        
        Optional<User> userByEmail = userRepository.findByEmail(username);
        if (userByEmail.isPresent()) {
            return userByEmail.get().getId();
        }
        
        throw new RuntimeException("User not found: " + username);
    }
}