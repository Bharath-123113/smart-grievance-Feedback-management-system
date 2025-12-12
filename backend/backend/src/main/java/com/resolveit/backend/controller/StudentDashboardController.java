package com.resolveit.backend.controller;

import com.resolveit.backend.dto.DashboardStatsDTO;
import com.resolveit.backend.dto.GrievanceFilterRequest;
import com.resolveit.backend.dto.GrievanceRequestDTO;
import com.resolveit.backend.dto.GrievanceResponseDTO;
import com.resolveit.backend.dto.PaginatedResponse;
import com.resolveit.backend.entity.Category;
import com.resolveit.backend.entity.Department;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.DepartmentRepository;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.service.CategoryService;
import com.resolveit.backend.service.GrievanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard/student")
public class StudentDashboardController {
    
    @Autowired
    private GrievanceService grievanceService;
    
    @Autowired
    private CategoryService categoryService;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;
    
    // Get dashboard statistics
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        Long studentId = getCurrentUserId();
        DashboardStatsDTO stats = grievanceService.getStudentDashboardStats(studentId);
        return ResponseEntity.ok(stats);
    }
    
    // Get all grievances for current student (WITH PAGINATION)
    @GetMapping("/grievances")
    public ResponseEntity<PaginatedResponse<GrievanceResponseDTO>> getMyGrievances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Long studentId = getCurrentUserId();
        
        // Create pageable
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Get paginated grievances
        Page<Grievance> grievancePage = grievanceService.getStudentGrievances(studentId, pageable);
        
        // Convert to paginated response
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(response);
    }
    
    // SEARCH grievances by keyword
    @GetMapping("/grievances/search")
    public ResponseEntity<PaginatedResponse<GrievanceResponseDTO>> searchGrievances(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Long studentId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<Grievance> grievancePage = grievanceService.searchStudentGrievances(studentId, keyword, pageable);
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(response);
    }
    
    // FILTER grievances by status
    @GetMapping("/grievances/filter")
    public ResponseEntity<PaginatedResponse<GrievanceResponseDTO>> filterGrievances(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Long studentId = getCurrentUserId();
        
        // Create filter request
        GrievanceFilterRequest filterRequest = new GrievanceFilterRequest();
        filterRequest.setStatus(status);
        filterRequest.setCategoryId(categoryId);
        filterRequest.setPriority(priority);
        filterRequest.setStartDate(startDate);
        filterRequest.setEndDate(endDate);
        filterRequest.setPage(page);
        filterRequest.setSize(size);
        filterRequest.setSortBy(sortBy);
        filterRequest.setSortDirection(sortDir);
        
        // Apply filters
        Page<Grievance> grievancePage = grievanceService.filterStudentGrievances(studentId, filterRequest);
        PaginatedResponse<GrievanceResponseDTO> response = grievanceService.convertToPaginatedResponse(grievancePage);
        
        return ResponseEntity.ok(response);
    }
    
    // Get specific grievance
    @GetMapping("/grievances/{id}")
    public ResponseEntity<GrievanceResponseDTO> getGrievance(@PathVariable Long id) {
        Grievance grievance = grievanceService.getGrievanceById(id);
        
        // Check if the grievance belongs to current student
        Long currentUserId = getCurrentUserId();
        if (!grievance.getStudentId().equals(currentUserId)) {
            return ResponseEntity.status(403).build();
        }
        
        GrievanceResponseDTO dto = grievanceService.convertToResponseDTO(grievance);
        return ResponseEntity.ok(dto);
    }
    
    // Create new grievance
    @PostMapping("/grievances")
    public ResponseEntity<GrievanceResponseDTO> createGrievance(@RequestBody GrievanceRequestDTO request) {
        Long studentId = getCurrentUserId();
        Grievance grievance = grievanceService.createGrievance(request, studentId);
        GrievanceResponseDTO dto = grievanceService.convertToResponseDTO(grievance);
        return ResponseEntity.ok(dto);
    }
    
    // Get all categories (for dropdown in frontend)
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        List<Category> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(categories);
    }
    
    // Get all departments (for dropdown in frontend)
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        List<Department> departments = departmentRepository.findAll();
        return ResponseEntity.ok(departments);
    }
    
    // Helper method to get current user ID from JWT
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        // JWT stores the userId string as username (e.g., "Kumar123")
        String userIdString = authentication.getName();
        
        // Single optimized database query using userId
        User user = userRepository.findByUserId(userIdString)
            .orElseThrow(() -> new RuntimeException("User not found with userId: " + userIdString));
        
        return user.getId();
    }
}