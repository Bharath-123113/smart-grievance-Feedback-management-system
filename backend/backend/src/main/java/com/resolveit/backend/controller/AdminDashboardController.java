package com.resolveit.backend.controller;

import com.resolveit.backend.dto.*;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.service.GrievanceService;
import com.resolveit.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDashboardController {
    
    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GrievanceService grievanceService; // Added GrievanceService
    
    // Get current logged-in admin
    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUserId(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    }
    
    // ============ DASHBOARD STATISTICS ============
    
    /**
     * Get department statistics for admin
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentStatsDTO>> getDepartmentStats() {
        User admin = getCurrentAdmin();
        
        DepartmentStatsDTO stats = new DepartmentStatsDTO();
        
        Long departmentId = admin.getDepartmentId().longValue();
        
        // Count grievances by status
        stats.setTotalGrievances(grievanceRepository.countByDepartmentId(departmentId));
        stats.setNewGrievances(grievanceRepository.countByDepartmentIdAndStatus(departmentId, "submitted"));
        stats.setAssignedToAdmin(grievanceRepository.countByDepartmentIdAndStatus(departmentId, "assigned_to_admin"));
        stats.setAssignedToStaff(grievanceRepository.countByDepartmentIdAndStatus(departmentId, "assigned_to_staff"));
        stats.setInProgress(grievanceRepository.countByDepartmentIdAndStatus(departmentId, "in_progress"));
        stats.setResolved(grievanceRepository.countByDepartmentIdAndStatus(departmentId, "resolved"));
        stats.setRejected(grievanceRepository.countByDepartmentIdAndStatus(departmentId, "rejected"));
        
        // Count staff in department
        Long staffCount = userRepository.countByDepartmentIdAndRole(admin.getDepartmentId(), "staff");
        stats.setStaffCount(staffCount);
        
        // Calculate average resolution time for resolved grievances
        List<Grievance> resolvedGrievances = grievanceRepository.findByDepartmentIdAndStatus(departmentId, "resolved");
        if (!resolvedGrievances.isEmpty()) {
            long totalHours = 0;
            for (Grievance grievance : resolvedGrievances) {
                if (grievance.getCreatedAt() != null && grievance.getResolvedAt() != null) {
                    totalHours += ChronoUnit.HOURS.between(grievance.getCreatedAt(), grievance.getResolvedAt());
                }
            }
            stats.setAvgResolutionTime(totalHours / resolvedGrievances.size());
        } else {
            stats.setAvgResolutionTime(0L);
        }
        
        return ResponseEntity.ok(ApiResponse.success("Department statistics retrieved", stats));
    }
    
    // ============ GRIEVANCE MANAGEMENT ============
    
    /**
     * Get all grievances in admin's department (with pagination)
     */
    @GetMapping("/grievances")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Grievance>>> getDepartmentGrievances() {
        User admin = getCurrentAdmin();
        
        List<Grievance> grievances = grievanceRepository.findByDepartmentId(admin.getDepartmentId().longValue());
        
        return ResponseEntity.ok(ApiResponse.success("Grievances retrieved successfully", grievances));
    }
    
    /**
     * NEW: Filter and search grievances with pagination
     */
    @PostMapping("/grievances/filter")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> filterGrievances(
            @RequestBody GrievanceFilterRequest filterRequest) {
        
        User admin = getCurrentAdmin();
        
        // Set department ID from admin's department (ensures admin can only see their department's grievances)
        filterRequest.setDepartmentId(admin.getDepartmentId().longValue());
        
        // Filter grievances using GrievanceService
        Page<Grievance> grievancePage = grievanceService.filterAdminGrievances(
            admin.getDepartmentId().longValue(),
            filterRequest
        );
        
        // Convert to response DTO with pagination
        PaginatedResponse<GrievanceResponseDTO> response = 
            grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(ApiResponse.success("Filtered grievances retrieved", response));
    }
    
    /**
     * NEW: Search grievances by keyword
     */
    @GetMapping("/grievances/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> searchGrievances(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        User admin = getCurrentAdmin();
        
        // Create pageable
        org.springframework.data.domain.Pageable pageable = 
            org.springframework.data.domain.PageRequest.of(page, size, 
                org.springframework.data.domain.Sort.by("createdAt").descending());
        
        // Search grievances
        Page<Grievance> grievancePage = grievanceService.searchDepartmentGrievances(
            admin.getDepartmentId().longValue(),
            keyword,
            pageable
        );
        
        // Convert to response DTO with pagination
        PaginatedResponse<GrievanceResponseDTO> response = 
            grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(ApiResponse.success("Search results retrieved", response));
    }
    
    /**
     * NEW: Get grievances with pagination
     */
    @GetMapping("/grievances/paginated")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> getPaginatedGrievances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        
        User admin = getCurrentAdmin();
        
        // Create pageable
        org.springframework.data.domain.Pageable pageable = 
            org.springframework.data.domain.PageRequest.of(page, size, 
                org.springframework.data.domain.Sort.by("createdAt").descending());
        
        Page<Grievance> grievancePage;
        
        if (status != null && !status.trim().isEmpty()) {
            // Get grievances by status
            grievancePage = grievanceService.getDepartmentGrievancesByStatus(
                admin.getDepartmentId().longValue(),
                status,
                pageable
            );
        } else {
            // Get all grievances
            grievancePage = grievanceService.getDepartmentGrievances(
                admin.getDepartmentId().longValue(),
                pageable
            );
        }
        
        // Convert to response DTO with pagination
        PaginatedResponse<GrievanceResponseDTO> response = 
            grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(ApiResponse.success("Grievances retrieved", response));
    }
    
    /**
     * Get new/unassigned grievances in department
     */
    @GetMapping("/grievances/new")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Grievance>>> getNewGrievances() {
        User admin = getCurrentAdmin();
        
        List<Grievance> newGrievances = grievanceRepository.findByDepartmentIdAndStatus(
            admin.getDepartmentId().longValue(), 
            "submitted"
        );
        
        return ResponseEntity.ok(ApiResponse.success("New grievances retrieved", newGrievances));
    }
    
    /**
     * Get grievances assigned to current admin
     */
    @GetMapping("/grievances/assigned-to-me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Grievance>>> getGrievancesAssignedToMe() {
        User admin = getCurrentAdmin();
        
        List<Grievance> myGrievances = grievanceRepository.findByDepartmentIdAndAssignedAdminId(
            admin.getDepartmentId().longValue(),
            admin.getId()
        );
        
        return ResponseEntity.ok(ApiResponse.success("Your assigned grievances", myGrievances));
    }
    
    /**
     * Assign grievance to admin (admin claims it)
     */
    @PutMapping("/grievances/{grievanceId}/assign-to-me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Grievance>> assignGrievanceToMe(@PathVariable Long grievanceId) {
        User admin = getCurrentAdmin();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Verify grievance belongs to admin's department
        if (!grievance.getDepartmentId().equals(admin.getDepartmentId().longValue())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Grievance>error("Cannot assign grievances from other departments", null));
        }
        
        // Verify grievance is in submitted status
        if (!"submitted".equals(grievance.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Grievance>error("Grievance is already assigned or processed", null));
        }
        
        // Assign to admin
        grievance.setAssignedAdminId(admin.getId());
        grievance.setAssignedTo(admin.getId());
        grievance.setStatus("assigned_to_admin");
        grievance.setUpdatedAt(LocalDateTime.now());
        
        Grievance updated = grievanceRepository.save(grievance);
        
        // Notify admin (optional)
        try {
            notificationService.notifyGrievanceAssigned(updated, admin);
        } catch (Exception e) {
            System.err.println("Notification failed: " + e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Grievance assigned to you", updated));
    }
    
    /**
     * Assign grievance to staff member
     */
    @PutMapping("/grievances/{grievanceId}/assign-to-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Grievance>> assignToStaff(
            @PathVariable Long grievanceId,
            @RequestBody GrievanceAssignmentDTO assignmentDTO) {
        
        User admin = getCurrentAdmin();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // 1. Verify admin is assigned to this grievance
        if (grievance.getAssignedAdminId() != null && !grievance.getAssignedAdminId().equals(admin.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Grievance>error("Not assigned to this grievance", null));
        }
        
        User staff = userRepository.findById(assignmentDTO.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        
        // 2. Verify staff is in same department and has role 'staff'
        if (!staff.getDepartmentId().equals(admin.getDepartmentId()) || 
            !"staff".equals(staff.getRole())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Grievance>error("Invalid staff member for this department", null));
        }
        
        // 3. Assign to staff
        grievance.setAssignedTo(staff.getId());
        grievance.setAssignedAdminId(admin.getId()); // Keep admin reference
        grievance.setStatus("in_progress");
        grievance.setUpdatedAt(LocalDateTime.now());
        
        // Add assignment notes if provided
        if (assignmentDTO.getNotes() != null && !assignmentDTO.getNotes().trim().isEmpty()) {
            String currentNotes = grievance.getResolutionNotes() != null ? 
                    grievance.getResolutionNotes() + "\n" : "";
            grievance.setResolutionNotes(currentNotes + "Assignment Notes: " + assignmentDTO.getNotes());
        }
        
        Grievance updated = grievanceRepository.save(grievance);
        
        // 4. Notify staff (optional)
        try {
            notificationService.notifyStaffAssignment(updated, staff);
        } catch (Exception e) {
            System.err.println("Notification failed: " + e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Grievance assigned to staff", updated));
    }
    
    /**
     * Get detailed grievance info with DTO
     */
    @GetMapping("/grievances/{grievanceId}/details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GrievanceResponseDTO>> getGrievanceDetails(@PathVariable Long grievanceId) {
        User admin = getCurrentAdmin();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Verify admin has access to this grievance
        if (!grievance.getDepartmentId().equals(admin.getDepartmentId().longValue())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<GrievanceResponseDTO>error("Cannot access grievances from other departments", null));
        }
        
        // Convert to DTO
        GrievanceResponseDTO dto = grievanceService.convertToResponseDTO(grievance);
        
        return ResponseEntity.ok(ApiResponse.success("Grievance details", dto));
    }
    
    // ============ STAFF MANAGEMENT ============
    
    /**
     * Get all staff members in admin's department
     */
    @GetMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getDepartmentStaff() {
        User admin = getCurrentAdmin();
        
        List<User> staffMembers = userRepository.findByDepartmentIdAndRole(
            admin.getDepartmentId(), 
            "staff"
        );
        
        return ResponseEntity.ok(ApiResponse.success("Staff members retrieved", staffMembers));
    }
    
    /**
     * Get staff performance statistics
     */
    @GetMapping("/staff/performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StaffPerformanceDTO>>> getStaffPerformance() {
        User admin = getCurrentAdmin();
        
        List<User> staffMembers = userRepository.findByDepartmentIdAndRole(
            admin.getDepartmentId(), 
            "staff"
        );
        
        List<StaffPerformanceDTO> performanceList = staffMembers.stream().map(staff -> {
            StaffPerformanceDTO dto = new StaffPerformanceDTO();
            dto.setStaffId(staff.getId());
            dto.setStaffName(staff.getFirstName() + " " + staff.getLastName());
            dto.setStaffEmail(staff.getEmail());
            
            // Get assigned grievances count
            List<Grievance> assignedGrievances = grievanceRepository.findByAssignedToAndDepartmentId(
                staff.getId(), 
                admin.getDepartmentId().longValue()
            );
            dto.setAssignedGrievances((long) assignedGrievances.size());
            
            // Get resolved grievances count
            long resolvedCount = assignedGrievances.stream()
                    .filter(g -> "resolved".equals(g.getStatus()))
                    .count();
            dto.setResolvedGrievances(resolvedCount);
            
            // Get pending grievances count
            long pendingCount = assignedGrievances.stream()
                    .filter(g -> !"resolved".equals(g.getStatus()) && !"rejected".equals(g.getStatus()))
                    .count();
            dto.setPendingGrievances(pendingCount);
            
            // Calculate resolution rate
            if (assignedGrievances.size() > 0) {
                dto.setResolutionRate((double) resolvedCount / assignedGrievances.size() * 100);
            } else {
                dto.setResolutionRate(0.0);
            }
            
            // Calculate average resolution time for resolved grievances
            if (resolvedCount > 0) {
                long totalHours = 0;
                List<Grievance> resolvedGrievances = assignedGrievances.stream()
                        .filter(g -> "resolved".equals(g.getStatus()))
                        .collect(Collectors.toList());
                
                for (Grievance grievance : resolvedGrievances) {
                    if (grievance.getCreatedAt() != null && grievance.getResolvedAt() != null) {
                        totalHours += ChronoUnit.HOURS.between(grievance.getCreatedAt(), grievance.getResolvedAt());
                    }
                }
                dto.setAvgResolutionTime(totalHours / resolvedCount);
            } else {
                dto.setAvgResolutionTime(0L);
            }
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Staff performance statistics", performanceList));
    }
    
    /**
     * Reject a grievance (admin can reject without assigning)
     */
    @PutMapping("/grievances/{grievanceId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Grievance>> rejectGrievance(
            @PathVariable Long grievanceId,
            @RequestParam String reason) {
        
        User admin = getCurrentAdmin();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Verify admin has access to this grievance
        if (!grievance.getDepartmentId().equals(admin.getDepartmentId().longValue())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Grievance>error("Cannot reject grievances from other departments", null));
        }
        
        // Update status to rejected
        grievance.setStatus("rejected");
        grievance.setAssignedAdminId(admin.getId());
        grievance.setResolutionNotes("Rejected by admin: " + reason);
        grievance.setUpdatedAt(LocalDateTime.now());
        
        Grievance updated = grievanceRepository.save(grievance);
        
        // Notify student (optional)
        try {
            notificationService.notifyStatusUpdate(updated);
        } catch (Exception e) {
            System.err.println("Notification failed: " + e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Grievance rejected", updated));
    }
    
    /**
     * Get dashboard summary (quick stats)
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary() {
        User admin = getCurrentAdmin();
        Long departmentId = admin.getDepartmentId().longValue();
        
        Map<String, Object> summary = new HashMap<>();
        
        // Basic counts
        summary.put("totalGrievances", grievanceRepository.countByDepartmentId(departmentId));
        summary.put("newGrievances", grievanceRepository.countByDepartmentIdAndStatus(departmentId, "submitted"));
        summary.put("myAssignedGrievances", 
            grievanceRepository.countByDepartmentIdAndAssignedAdminId(departmentId, admin.getId()));
        
        // Staff count
        summary.put("staffCount", userRepository.countByDepartmentIdAndRole(admin.getDepartmentId(), "staff"));
        
        // Recent activity (last 5 grievances)
        List<Grievance> recentGrievances = grievanceService.getRecentDepartmentGrievances(departmentId, 5);
        summary.put("recentGrievances", recentGrievances);
        
        return ResponseEntity.ok(ApiResponse.success("Dashboard summary", summary));
    }
}