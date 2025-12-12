package com.resolveit.backend.service;

import com.resolveit.backend.dto.DashboardStatsDTO;
import com.resolveit.backend.dto.FeedbackDTO;
import com.resolveit.backend.dto.GrievanceFilterRequest;
import com.resolveit.backend.dto.GrievanceRequestDTO;
import com.resolveit.backend.dto.GrievanceResponseDTO;
import com.resolveit.backend.dto.PaginatedResponse;
import com.resolveit.backend.entity.Category;
import com.resolveit.backend.entity.Department;
import com.resolveit.backend.entity.Feedback;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.CategoryRepository;
import com.resolveit.backend.repository.DepartmentRepository;
import com.resolveit.backend.repository.FeedbackRepository;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class GrievanceService {
    
    @Autowired
    private GrievanceRepository grievanceRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private FeedbackRepository feedbackRepository;
    
    // ==================== CREATE GRIEVANCE ====================
    
    public Grievance createGrievance(GrievanceRequestDTO request, Long studentId) {
        // Validate student exists
        userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        
        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Category not found with ID: " + request.getCategoryId()));
        
        // Validate department exists
        departmentRepository.findById(request.getDepartmentId())
            .orElseThrow(() -> new RuntimeException("Department not found with ID: " + request.getDepartmentId()));
        
        // Validate priority
        List<String> validPriorities = List.of("low", "medium", "high", "urgent");
        if (!validPriorities.contains(request.getPriority().toLowerCase())) {
            throw new RuntimeException("Invalid priority. Must be: low, medium, high, urgent");
        }
        
        Grievance grievance = new Grievance();
        grievance.setTitle(request.getTitle());
        grievance.setDescription(request.getDescription());
        grievance.setStudentId(studentId);
        grievance.setCategoryId(request.getCategoryId());
        grievance.setDepartmentId(request.getDepartmentId());
        grievance.setPriority(request.getPriority().toLowerCase());
        grievance.setStatus("submitted");
        
        return grievanceRepository.save(grievance);
    }
    
    // ==================== GET GRIEVANCE BY ID ====================
    
    public Grievance getGrievanceById(Long id) {
        return grievanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Grievance not found with ID: " + id));
    }
    
    // ==================== STUDENT GRIEVANCE METHODS ====================
    
    // Get student's grievances (with pagination) - NEW METHOD
    public Page<Grievance> getStudentGrievances(Long studentId, Pageable pageable) {
        return grievanceRepository.findByStudentIdOrderByCreatedAtDesc(studentId, pageable);
    }
    
    // Get student's grievances (without pagination) - KEEP FOR BACKWARD COMPATIBILITY
    public List<Grievance> getStudentGrievances(Long studentId) {
        return grievanceRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }
    
    public Page<Grievance> getStudentGrievancesByStatus(Long studentId, String status, Pageable pageable) {
        return grievanceRepository.findByStudentIdAndStatus(studentId, status, pageable);
    }
    
    public Page<Grievance> searchStudentGrievances(Long studentId, String keyword, Pageable pageable) {
        return grievanceRepository.searchByStudentAndKeyword(studentId, keyword, pageable);
    }
    
    public Page<Grievance> filterStudentGrievances(Long studentId, GrievanceFilterRequest filterRequest) {
        Pageable pageable = createPageable(filterRequest);
        
        // Check if dates are provided
        if (filterRequest.getStartDate() != null && filterRequest.getEndDate() != null) {
            // Use query WITH dates
            return grievanceRepository.findStudentGrievancesWithDates(
                studentId,
                filterRequest.getStatus(),
                filterRequest.getCategoryId(),
                filterRequest.getPriority(),
                filterRequest.getStartDate().atStartOfDay(),
                filterRequest.getEndDate().atTime(LocalTime.MAX),
                pageable
            );
        } else {
            // Use query WITHOUT dates
            return grievanceRepository.findStudentGrievancesWithoutDates(
                studentId,
                filterRequest.getStatus(),
                filterRequest.getCategoryId(),
                filterRequest.getPriority(),
                pageable
            );
        }
    }
    
    // ==================== STAFF GRIEVANCE METHODS ====================
    
    public Page<Grievance> getStaffGrievances(Long staffId, Pageable pageable) {
        return grievanceRepository.findByAssignedTo(staffId, pageable);
    }
    
    public Page<Grievance> getStaffGrievancesByStatus(Long staffId, String status, Pageable pageable) {
        return grievanceRepository.findByAssignedToAndStatus(staffId, status, pageable);
    }
    
    public Page<Grievance> searchStaffGrievances(Long staffId, String keyword, Pageable pageable) {
        return grievanceRepository.searchByStaffAndKeyword(staffId, keyword, pageable);
    }
    
    public Page<Grievance> filterStaffGrievances(Long staffId, GrievanceFilterRequest filterRequest) {
        Pageable pageable = createPageable(filterRequest);
        
        // Check if dates are provided
        if (filterRequest.getStartDate() != null && filterRequest.getEndDate() != null) {
            // Use query WITH dates
            return grievanceRepository.findStaffGrievancesWithAllFilters(
                staffId,
                filterRequest.getStatus(),
                filterRequest.getDepartmentId(),
                filterRequest.getPriority(),
                filterRequest.getStartDate().atStartOfDay(),
                filterRequest.getEndDate().atTime(LocalTime.MAX),
                pageable
            );
        } else {
            // Use query WITHOUT dates
            return grievanceRepository.findStaffGrievancesWithoutDates(
                staffId,
                filterRequest.getStatus(),
                filterRequest.getDepartmentId(),
                filterRequest.getPriority(),
                pageable
            );
        }
    }
    
    // ==================== ADMIN GRIEVANCE METHODS ====================
    
    public Page<Grievance> getDepartmentGrievances(Long departmentId, Pageable pageable) {
        return grievanceRepository.findByDepartmentId(departmentId, pageable);
    }
    
    public Page<Grievance> getDepartmentGrievancesByStatus(Long departmentId, String status, Pageable pageable) {
        return grievanceRepository.findByDepartmentIdAndStatus(departmentId, status, pageable);
    }
    
    public Page<Grievance> searchDepartmentGrievances(Long departmentId, String keyword, Pageable pageable) {
        return grievanceRepository.searchByDepartmentAndKeyword(departmentId, keyword, pageable);
    }
    
    public Page<Grievance> filterAdminGrievances(Long departmentId, GrievanceFilterRequest filterRequest) {
        Pageable pageable = createPageable(filterRequest);
        
        // Handle date conversion
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        
        if (filterRequest.getStartDate() != null) {
            startDate = filterRequest.getStartDate().atStartOfDay();
        }
        
        if (filterRequest.getEndDate() != null) {
            endDate = filterRequest.getEndDate().atTime(LocalTime.MAX);
        }
        
        // Use findAdminGrievancesWithFilters (it already handles null dates)
        return grievanceRepository.findAdminGrievancesWithFilters(
            departmentId,
            filterRequest.getStatus(),
            filterRequest.getCategoryId(),
            filterRequest.getPriority(),
            startDate,
            endDate,
            pageable
        );
    }
    
    // ==================== HELPER METHODS ====================
    
    private Pageable createPageable(GrievanceFilterRequest filterRequest) {
        int page = filterRequest.getPage() != null ? filterRequest.getPage() : 0;
        int size = filterRequest.getSize() != null ? filterRequest.getSize() : 10;
        String sortBy = filterRequest.getSortBy() != null ? filterRequest.getSortBy() : "createdAt";
        String sortDir = filterRequest.getSortDirection() != null ? filterRequest.getSortDirection() : "DESC";
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        sort = sort.and(Sort.by("id").descending());
        
        return PageRequest.of(page, size, sort);
    }
    
    public PaginatedResponse<GrievanceResponseDTO> convertToPaginatedResponse(Page<Grievance> grievancePage) {
        PaginatedResponse<GrievanceResponseDTO> response = new PaginatedResponse<>();
        
        List<GrievanceResponseDTO> content = grievancePage.getContent()
            .stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
        
        response.setContent(content);
        response.setPageNumber(grievancePage.getNumber());
        response.setPageSize(grievancePage.getSize());
        response.setTotalElements(grievancePage.getTotalElements());
        response.setTotalPages(grievancePage.getTotalPages());
        response.setLast(grievancePage.isLast());
        
        return response;
    }
    
    public DashboardStatsDTO getStudentDashboardStats(Long studentId) {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        
        stats.setTotalGrievances(grievanceRepository.countByStudentId(studentId));
        stats.setSubmittedGrievances(grievanceRepository.countByStudentIdAndStatus(studentId, "submitted"));
        stats.setInProgressGrievances(grievanceRepository.countByStudentIdAndStatus(studentId, "in_progress"));
        stats.setResolvedGrievances(grievanceRepository.countByStudentIdAndStatus(studentId, "resolved"));
        stats.setRejectedGrievances(grievanceRepository.countByStudentIdAndStatus(studentId, "rejected"));
        
        return stats;
    }
    
    public GrievanceResponseDTO convertToResponseDTO(Grievance grievance) {
        GrievanceResponseDTO dto = new GrievanceResponseDTO();
        
        dto.setId(grievance.getId());
        dto.setGrievanceId(grievance.getGrievanceId());
        dto.setTitle(grievance.getTitle());
        dto.setDescription(grievance.getDescription());
        dto.setPriority(grievance.getPriority());
        dto.setStatus(grievance.getStatus());
        dto.setCreatedAt(grievance.getCreatedAt());
        dto.setUpdatedAt(grievance.getUpdatedAt());
        dto.setResolvedAt(grievance.getResolvedAt());
        dto.setResolutionNotes(grievance.getResolutionNotes());
        
        // Get category
        if (grievance.getCategoryId() != null) {
            Category category = categoryRepository.findById(grievance.getCategoryId()).orElse(null);
            if (category != null) {
                dto.setCategoryName(category.getCategoryName());
                dto.setCategoryId(category.getId());
            }
        }
        
        // Get department
        if (grievance.getDepartmentId() != null) {
            Department department = departmentRepository.findById(grievance.getDepartmentId()).orElse(null);
            if (department != null) {
                dto.setDepartmentName(department.getDepartmentName());
                dto.setDepartmentId(department.getId());
            }
        }
        
        // Get student info
        if (grievance.getStudentId() != null) {
            User student = userRepository.findById(grievance.getStudentId()).orElse(null);
            if (student != null) {
                dto.setStudentName(student.getFirstName() + " " + student.getLastName());
                dto.setStudentEmail(student.getEmail());
            }
        }
        
        // Get assigned staff info
        if (grievance.getAssignedTo() != null) {
            User assignedUser = userRepository.findById(grievance.getAssignedTo()).orElse(null);
            if (assignedUser != null) {
                dto.setAssignedToName(assignedUser.getFirstName() + " " + assignedUser.getLastName());
                dto.setAssignedToEmail(assignedUser.getEmail());
            }
        }
        
        // Get feedback if exists
        if (grievance.getId() != null && grievance.getStudentId() != null) {
            Optional<Feedback> feedbackOptional = feedbackRepository.findByGrievanceIdAndSubmittedById(
                grievance.getId(), 
                grievance.getStudentId()
            );
            
            if (feedbackOptional.isPresent()) {
                Feedback feedback = feedbackOptional.get();
                FeedbackDTO feedbackDTO = convertFeedbackToDTO(feedback);
                dto.setFeedback(feedbackDTO);
            }
        }
        
        return dto;
    }
    
    private FeedbackDTO convertFeedbackToDTO(Feedback feedback) {
        return FeedbackDTO.builder()
            .id(feedback.getId())
            .grievanceId(feedback.getGrievance().getId())
            .grievanceTitle(feedback.getGrievance().getTitle())
            .rating(feedback.getRating())
            .comment(feedback.getComment())
            .submittedById(feedback.getSubmittedBy().getId())
            .submittedByName(feedback.getSubmittedBy().getFirstName() + " " + feedback.getSubmittedBy().getLastName())
            .createdAt(feedback.getCreatedAt())
            .build();
    }
    
    // ==================== UTILITY METHODS ====================
    
    public Page<Grievance> searchByGrievanceId(String grievanceId, Pageable pageable) {
        return grievanceRepository.findByGrievanceId(grievanceId, pageable);
    }
    
    public List<Grievance> getRecentStudentGrievances(Long studentId, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        Page<Grievance> page = grievanceRepository.findByStudentId(studentId, pageable);
        return page.getContent();
    }
    
    public List<Grievance> getRecentStaffGrievances(Long staffId, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by("updatedAt").descending());
        Page<Grievance> page = grievanceRepository.findByAssignedTo(staffId, pageable);
        return page.getContent();
    }
    
    public List<Grievance> getRecentDepartmentGrievances(Long departmentId, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        Page<Grievance> page = grievanceRepository.findByDepartmentId(departmentId, pageable);
        return page.getContent();
    }
}