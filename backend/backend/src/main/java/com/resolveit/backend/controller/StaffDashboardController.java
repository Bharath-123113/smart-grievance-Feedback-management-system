package com.resolveit.backend.controller;

import com.resolveit.backend.dto.ApiResponse;
import com.resolveit.backend.dto.GrievanceFilterRequest;
import com.resolveit.backend.dto.GrievanceResponseDTO;
import com.resolveit.backend.dto.PaginatedResponse;
import com.resolveit.backend.dto.StatusUpdateRequest;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.service.GrievanceService;
import com.resolveit.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/dashboard/staff")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StaffDashboardController {
    
    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final GrievanceService grievanceService;
    private final NotificationService notificationService;
    
    // Get current logged-in staff
    private User getCurrentStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUserId(username)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
    }
    
    // ============ STAFF DASHBOARD STATISTICS ============
    
    /**
     * Get staff dashboard statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStaffStats() {
        User staff = getCurrentStaff();
        
        Map<String, Object> stats = new HashMap<>();
        
        // Get all grievances assigned to this staff
        List<Grievance> assignedGrievances = grievanceRepository.findByAssignedTo(staff.getId());
        
        // Count by status
        stats.put("totalAssigned", (long) assignedGrievances.size());
        stats.put("inProgress", assignedGrievances.stream()
                .filter(g -> "in_progress".equals(g.getStatus()))
                .count());
        stats.put("resolved", assignedGrievances.stream()
                .filter(g -> "resolved".equals(g.getStatus()))
                .count());
        stats.put("pendingReview", assignedGrievances.stream()
                .filter(g -> "assigned_to_staff".equals(g.getStatus()))
                .count());
        
        // Calculate average resolution time for resolved grievances
        List<Grievance> resolvedGrievances = assignedGrievances.stream()
                .filter(g -> "resolved".equals(g.getStatus()))
                .collect(Collectors.toList());
        
        if (!resolvedGrievances.isEmpty()) {
            long totalHours = 0;
            for (Grievance grievance : resolvedGrievances) {
                if (grievance.getCreatedAt() != null && grievance.getResolvedAt() != null) {
                    totalHours += ChronoUnit.HOURS.between(grievance.getCreatedAt(), grievance.getResolvedAt());
                }
            }
            stats.put("avgResolutionTime", totalHours / resolvedGrievances.size());
            stats.put("resolutionRate", (double) resolvedGrievances.size() / assignedGrievances.size() * 100);
        } else {
            stats.put("avgResolutionTime", 0);
            stats.put("resolutionRate", 0.0);
        }
        
        // Recent activity count (last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long recentActivity = assignedGrievances.stream()
                .filter(g -> g.getUpdatedAt() != null && g.getUpdatedAt().isAfter(weekAgo))
                .count();
        stats.put("recentActivity", recentActivity);
        
        return ResponseEntity.ok(ApiResponse.success("Staff statistics", stats));
    }
    
    // ============ GRIEVANCE MANAGEMENT WITH PAGINATION ============
    
    /**
     * Get grievances assigned to current staff (WITH PAGINATION)
     */
    @GetMapping("/grievances")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> getMyGrievances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        User staff = getCurrentStaff();
        
        // Create pageable
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Get paginated grievances
        Page<Grievance> grievancePage = grievanceService.getStaffGrievances(staff.getId(), pageable);
        
        // Convert to paginated response
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(ApiResponse.success("Your assigned grievances", response));
    }
    
    /**
     * Get grievances by status for current staff (WITH PAGINATION)
     */
    @GetMapping("/grievances/status/{status}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> getGrievancesByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        User staff = getCurrentStaff();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Grievance> grievancePage = grievanceService.getStaffGrievancesByStatus(staff.getId(), status, pageable);
        
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        return ResponseEntity.ok(ApiResponse.success("Grievances with status: " + status, response));
    }
    
    /**
     * SEARCH grievances by keyword (title or description)
     */
    @GetMapping("/grievances/search")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> searchGrievances(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        User staff = getCurrentStaff();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Grievance> grievancePage = grievanceService.searchStaffGrievances(staff.getId(), keyword, pageable);
        
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        return ResponseEntity.ok(ApiResponse.success("Search results for: " + keyword, response));
    }
    
    /**
     * FILTER grievances with advanced options
     */
    @GetMapping("/grievances/filter")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PaginatedResponse<GrievanceResponseDTO>>> filterGrievances(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        User staff = getCurrentStaff();
        
        // Create filter request
        GrievanceFilterRequest filterRequest = new GrievanceFilterRequest();
        filterRequest.setStatus(status);
        filterRequest.setDepartmentId(departmentId);
        filterRequest.setPriority(priority);
        filterRequest.setSearchKeyword(searchKeyword);
        filterRequest.setPage(page);
        filterRequest.setSize(size);
        filterRequest.setSortBy(sortBy);
        filterRequest.setSortDirection(sortDir);
        
        // Apply filters
        Page<Grievance> grievancePage = grievanceService.filterStaffGrievances(staff.getId(), filterRequest);
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(ApiResponse.success("Filtered grievances", response));
    }
    
    /**
     * Get grievance details
     */
    @GetMapping("/grievances/{grievanceId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<GrievanceResponseDTO>> getGrievanceDetails(@PathVariable Long grievanceId) {
        User staff = getCurrentStaff();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Verify staff is assigned to this grievance
        if (!grievance.getAssignedTo().equals(staff.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Not assigned to this grievance", null));
        }
        
        GrievanceResponseDTO dto = grievanceService.convertToResponseDTO(grievance);
        return ResponseEntity.ok(ApiResponse.success("Grievance details", dto));
    }
    
    /**
     * Update grievance status (staff updates)
     */
    @PutMapping("/grievances/{grievanceId}/status")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<GrievanceResponseDTO>> updateGrievanceStatus(
            @PathVariable Long grievanceId,
            @RequestBody StatusUpdateRequest request) {
        
        User staff = getCurrentStaff();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Verify staff is assigned to this grievance
        if (!grievance.getAssignedTo().equals(staff.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Not assigned to this grievance", null));
        }
        
        // Update status
        String oldStatus = grievance.getStatus();
        grievance.setStatus(request.getStatus());
        
        // Handle resolution
        if ("resolved".equals(request.getStatus())) {
            grievance.setResolvedBy(staff.getId());
            grievance.setResolvedAt(LocalDateTime.now());
            if (request.getNote() != null && !request.getNote().trim().isEmpty()) {
                String currentNotes = grievance.getResolutionNotes() != null ? 
                        grievance.getResolutionNotes() + "\n" : "";
                grievance.setResolutionNotes(currentNotes + "Resolution Notes: " + request.getNote());
            }
        } else if ("in_progress".equals(request.getStatus())) {
            // Add progress notes if provided
            if (request.getNote() != null && !request.getNote().trim().isEmpty()) {
                String currentNotes = grievance.getResolutionNotes() != null ? 
                        grievance.getResolutionNotes() + "\n" : "";
                grievance.setResolutionNotes(currentNotes + "Progress Update: " + request.getNote());
            }
        }
        
        grievance.setUpdatedAt(LocalDateTime.now());
        
        Grievance updated = grievanceRepository.save(grievance);
        
        // Notify student and admin (optional)
        try {
            notificationService.notifyStatusUpdate(updated);
        } catch (Exception e) {
            System.err.println("Notification failed: " + e.getMessage());
        }
        
        GrievanceResponseDTO dto = grievanceService.convertToResponseDTO(updated);
        String message = "Status updated from " + oldStatus + " to " + request.getStatus();
        return ResponseEntity.ok(ApiResponse.success(message, dto));
    }
    
    /**
     * Add notes/comments to grievance
     */
    @PutMapping("/grievances/{grievanceId}/add-notes")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<GrievanceResponseDTO>> addNotesToGrievance(
            @PathVariable Long grievanceId,
            @RequestParam String notes) {
        
        User staff = getCurrentStaff();
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Verify staff is assigned to this grievance
        if (!grievance.getAssignedTo().equals(staff.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Not assigned to this grievance", null));
        }
        
        // Add notes
        String currentNotes = grievance.getResolutionNotes() != null ? 
                grievance.getResolutionNotes() + "\n" : "";
        grievance.setResolutionNotes(currentNotes + 
                "[" + LocalDateTime.now().toString() + "] " + staff.getFirstName() + ": " + notes);
        grievance.setUpdatedAt(LocalDateTime.now());
        
        Grievance updated = grievanceRepository.save(grievance);
        GrievanceResponseDTO dto = grievanceService.convertToResponseDTO(updated);
        
        return ResponseEntity.ok(ApiResponse.success("Notes added", dto));
    }
    
    /**
     * Get recent activity (last 5 updates)
     */
    @GetMapping("/activity")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<GrievanceResponseDTO>>> getRecentActivity() {
        User staff = getCurrentStaff();
        
        List<Grievance> recentGrievances = grievanceRepository
            .findTop5ByAssignedToOrderByUpdatedAtDesc(staff.getId());
        
        List<GrievanceResponseDTO> recentActivity = recentGrievances.stream()
                .map(grievanceService::convertToResponseDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Recent activity", recentActivity));
    }
    
    /**
     * Get recent grievances for dashboard (limited to 5)
     */
    @GetMapping("/recent-grievances")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<GrievanceResponseDTO>>> getRecentGrievances() {
        User staff = getCurrentStaff();
        
        List<Grievance> recentGrievances = grievanceService.getRecentStaffGrievances(staff.getId(), 5);
        
        List<GrievanceResponseDTO> recentDTOs = recentGrievances.stream()
                .map(grievanceService::convertToResponseDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Recent grievances", recentDTOs));
    }
    
    /**
     * Get performance overview
     */
    @GetMapping("/performance")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPerformanceOverview() {
        User staff = getCurrentStaff();
        
        Map<String, Object> performance = new HashMap<>();
        
        // Get all assigned grievances
        List<Grievance> assignedGrievances = grievanceRepository.findByAssignedTo(staff.getId());
        
        // Basic stats
        performance.put("totalAssigned", (long) assignedGrievances.size());
        
        long resolvedCount = assignedGrievances.stream()
                .filter(g -> "resolved".equals(g.getStatus()))
                .count();
        performance.put("resolved", resolvedCount);
        
        long inProgressCount = assignedGrievances.stream()
                .filter(g -> "in_progress".equals(g.getStatus()))
                .count();
        performance.put("inProgress", inProgressCount);
        
        // Resolution rate
        if (assignedGrievances.size() > 0) {
            performance.put("resolutionRate", (double) resolvedCount / assignedGrievances.size() * 100);
        } else {
            performance.put("resolutionRate", 0.0);
        }
        
        // Average resolution time
        List<Grievance> resolvedGrievances = assignedGrievances.stream()
                .filter(g -> "resolved".equals(g.getStatus()))
                .collect(Collectors.toList());
        
        if (!resolvedGrievances.isEmpty()) {
            long totalHours = 0;
            for (Grievance grievance : resolvedGrievances) {
                if (grievance.getCreatedAt() != null && grievance.getResolvedAt() != null) {
                    totalHours += ChronoUnit.HOURS.between(grievance.getCreatedAt(), grievance.getResolvedAt());
                }
            }
            performance.put("avgResolutionTime", totalHours / resolvedGrievances.size());
        } else {
            performance.put("avgResolutionTime", 0L);
        }
        
        // Monthly performance (last 6 months)
        Map<String, Long> monthlyPerformance = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            
            long monthResolved = assignedGrievances.stream()
                    .filter(g -> g.getResolvedAt() != null && 
                            g.getResolvedAt().isAfter(monthStart) && 
                            g.getResolvedAt().isBefore(monthEnd))
                    .count();
            
            String monthName = monthStart.getMonth().toString().substring(0, 3) + " " + monthStart.getYear();
            monthlyPerformance.put(monthName, monthResolved);
        }
        
        performance.put("monthlyPerformance", monthlyPerformance);
        
        return ResponseEntity.ok(ApiResponse.success("Performance overview", performance));
    }
    
    /**
     * Get priority list (urgent/high priority grievances)
     */
    @GetMapping("/priority-list")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<GrievanceResponseDTO>>> getPriorityList() {
        User staff = getCurrentStaff();
        
        // Get urgent and high priority grievances
        List<Grievance> priorityGrievances = grievanceRepository.findByAssignedTo(staff.getId())
                .stream()
                .filter(g -> "urgent".equalsIgnoreCase(g.getPriority()) || 
                           "high".equalsIgnoreCase(g.getPriority()))
                .filter(g -> !"resolved".equals(g.getStatus()) && !"rejected".equals(g.getStatus()))
                .sorted((g1, g2) -> {
                    // Sort by priority first, then by date
                    if (g1.getPriority().equals(g2.getPriority())) {
                        return g2.getCreatedAt().compareTo(g1.getCreatedAt());
                    }
                    return g1.getPriority().compareTo(g2.getPriority());
                })
                .limit(10)
                .collect(Collectors.toList());
        
        List<GrievanceResponseDTO> priorityList = priorityGrievances.stream()
                .map(grievanceService::convertToResponseDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Priority grievances list", priorityList));
    }
}