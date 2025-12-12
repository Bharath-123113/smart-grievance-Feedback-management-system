package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Grievance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, Long> {
    
    // ==================== EXISTING QUERIES (KEEP THESE) ====================
    
    // Student-related queries
    List<Grievance> findByStudentId(Long studentId);
    List<Grievance> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    long countByStudentId(Long studentId);
    long countByStudentIdAndStatus(Long studentId, String status);
    
    // Department-related queries
    List<Grievance> findByDepartmentId(Long departmentId);
    List<Grievance> findByDepartmentIdAndStatus(Long departmentId, String status);
    Long countByDepartmentId(Long departmentId);
    Long countByDepartmentIdAndStatus(Long departmentId, String status);
    
    // Assignment-related queries
    List<Grievance> findByAssignedTo(Long assignedTo);
    List<Grievance> findByAssignedToAndStatus(Long assignedTo, String status);
    List<Grievance> findByAssignedToAndDepartmentId(Long assignedTo, Long departmentId);
    List<Grievance> findByAssignedToAndStatusIn(Long assignedTo, List<String> statuses);
    
    // Admin-related queries
    Long countByDepartmentIdAndAssignedAdminId(Long departmentId, Long assignedAdminId);
    List<Grievance> findByDepartmentIdAndAssignedAdminId(Long departmentId, Long assignedAdminId);
    
    // Top queries for dashboards
    List<Grievance> findTop5ByDepartmentIdOrderByCreatedAtDesc(Long departmentId);
    List<Grievance> findTop5ByAssignedToOrderByUpdatedAtDesc(Long assignedTo);
    List<Grievance> findTop5ByDepartmentIdOrderByUpdatedAtDesc(Long departmentId);
    
    // Utility queries
    Grievance findByGrievanceId(String grievanceId);
    
    // Time-based queries for statistics
    @Query("SELECT COUNT(g) FROM Grievance g WHERE g.departmentId = :departmentId AND g.createdAt >= :startDate")
    Long countByDepartmentIdAndCreatedAfter(@Param("departmentId") Long departmentId, 
                                            @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(g) FROM Grievance g WHERE g.departmentId = :departmentId AND g.status = :status AND g.createdAt >= :startDate")
    Long countByDepartmentIdAndStatusAndCreatedAfter(@Param("departmentId") Long departmentId,
                                                     @Param("status") String status,
                                                     @Param("startDate") LocalDateTime startDate);
    
    // Performance metrics
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, g.createdAt, g.resolvedAt)) FROM Grievance g " +
           "WHERE g.departmentId = :departmentId AND g.status = 'resolved' AND g.resolvedAt IS NOT NULL")
    Double findAverageResolutionTimeByDepartment(@Param("departmentId") Long departmentId);
    
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, g.createdAt, g.resolvedAt)) FROM Grievance g " +
           "WHERE g.assignedTo = :staffId AND g.status = 'resolved' AND g.resolvedAt IS NOT NULL")
    Double findAverageResolutionTimeByStaff(@Param("staffId") Long staffId);
    
    // Find grievances by status and time range
    @Query("SELECT g FROM Grievance g WHERE g.departmentId = :departmentId " +
           "AND g.status = :status AND g.updatedAt >= :startDate ORDER BY g.updatedAt DESC")
    List<Grievance> findByDepartmentIdAndStatusAndUpdatedAfter(@Param("departmentId") Long departmentId,
                                                                @Param("status") String status,
                                                                @Param("startDate") LocalDateTime startDate);
    
    // ==================== NEW: PAGINATION METHODS ====================
    
    // Student pagination
    Page<Grievance> findByStudentId(Long studentId, Pageable pageable);
    Page<Grievance> findByStudentIdAndStatus(Long studentId, String status, Pageable pageable);
    Page<Grievance> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);
    
    // Department pagination  
    Page<Grievance> findByDepartmentId(Long departmentId, Pageable pageable);
    Page<Grievance> findByDepartmentIdAndStatus(Long departmentId, String status, Pageable pageable);
    
    // Staff pagination
    Page<Grievance> findByAssignedTo(Long assignedTo, Pageable pageable);
    Page<Grievance> findByAssignedToAndStatus(Long assignedTo, String status, Pageable pageable);
    Page<Grievance> findByAssignedToAndDepartmentId(Long assignedTo, Long departmentId, Pageable pageable);
    
    // Admin pagination
    Page<Grievance> findByDepartmentIdAndAssignedAdminId(Long departmentId, Long assignedAdminId, Pageable pageable);
    
    // ==================== NEW: SEARCH METHODS ====================
    
    // Search by keyword for student (title or description)
    @Query("SELECT g FROM Grievance g WHERE g.studentId = :studentId AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Grievance> searchByStudentAndKeyword(@Param("studentId") Long studentId, 
                                              @Param("keyword") String keyword, 
                                              Pageable pageable);
    
    // Search by keyword for department (title or description)
    @Query("SELECT g FROM Grievance g WHERE g.departmentId = :departmentId AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Grievance> searchByDepartmentAndKeyword(@Param("departmentId") Long departmentId, 
                                                 @Param("keyword") String keyword, 
                                                 Pageable pageable);
    
    // Search by keyword for staff (title or description)
    @Query("SELECT g FROM Grievance g WHERE g.assignedTo = :staffId AND " +
           "(LOWER(g.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Grievance> searchByStaffAndKeyword(@Param("staffId") Long staffId, 
                                            @Param("keyword") String keyword, 
                                            Pageable pageable);
    
    // Search by Grievance ID (exact match)
    @Query("SELECT g FROM Grievance g WHERE g.grievanceId = :grievanceId")
    Page<Grievance> findByGrievanceId(@Param("grievanceId") String grievanceId, Pageable pageable);
    
    // ==================== NEW: ADVANCED FILTER METHODS ====================
    
    // ==================== STUDENT FILTERS ====================
    
    // Student WITHOUT dates
    @Query("SELECT g FROM Grievance g WHERE g.studentId = :studentId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:categoryId IS NULL OR g.categoryId = :categoryId) " +
           "AND (:priority IS NULL OR g.priority = :priority) " +
           "ORDER BY g.createdAt DESC")
    Page<Grievance> findStudentGrievancesWithoutDates(
        @Param("studentId") Long studentId,
        @Param("status") String status,
        @Param("categoryId") Long categoryId,
        @Param("priority") String priority,
        Pageable pageable);
    
    // Student WITH dates
    @Query("SELECT g FROM Grievance g WHERE g.studentId = :studentId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:categoryId IS NULL OR g.categoryId = :categoryId) " +
           "AND (:priority IS NULL OR g.priority = :priority) " +
           "AND g.createdAt >= :startDate " +
           "AND g.createdAt <= :endDate " +
           "ORDER BY g.createdAt DESC")
    Page<Grievance> findStudentGrievancesWithDates(
        @Param("studentId") Long studentId,
        @Param("status") String status,
        @Param("categoryId") Long categoryId,
        @Param("priority") String priority,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable);
    
    // ==================== STAFF FILTERS ====================
    
    // Staff WITHOUT dates (ADD THIS METHOD)
    @Query("SELECT g FROM Grievance g WHERE g.assignedTo = :staffId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:departmentId IS NULL OR g.departmentId = :departmentId) " +
           "AND (:priority IS NULL OR g.priority = :priority) " +
           "ORDER BY g.createdAt DESC")
    Page<Grievance> findStaffGrievancesWithoutDates(
        @Param("staffId") Long staffId,
        @Param("status") String status,
        @Param("departmentId") Long departmentId,
        @Param("priority") String priority,
        Pageable pageable);
    
    // Staff WITH dates
    @Query("SELECT g FROM Grievance g WHERE g.assignedTo = :staffId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:departmentId IS NULL OR g.departmentId = :departmentId) " +
           "AND (:priority IS NULL OR g.priority = :priority) " +
           "AND g.createdAt >= :startDate " +
           "AND g.createdAt <= :endDate " +
           "ORDER BY g.createdAt DESC")
    Page<Grievance> findStaffGrievancesWithAllFilters(
        @Param("staffId") Long staffId,
        @Param("status") String status,
        @Param("departmentId") Long departmentId,
        @Param("priority") String priority,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable);
    
    // ==================== ADMIN FILTERS ====================
    
    // Admin with all optional parameters
    @Query("SELECT g FROM Grievance g WHERE g.departmentId = :departmentId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:categoryId IS NULL OR g.categoryId = :categoryId) " +
           "AND (:priority IS NULL OR g.priority = :priority) " +
           "AND (:startDate IS NULL OR g.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR g.createdAt <= :endDate) " +
           "ORDER BY g.createdAt DESC")
    Page<Grievance> findAdminGrievancesWithFilters(
        @Param("departmentId") Long departmentId,
        @Param("status") String status,
        @Param("categoryId") Long categoryId,
        @Param("priority") String priority,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable);
    
    // ==================== DEPRECATED METHODS (COMMENT OUT OR REMOVE) ====================
    
    // DEPRECATED: Student with CASE WHEN (causes PostgreSQL type inference issues)
    // @Query("SELECT g FROM Grievance g WHERE g.studentId = :studentId " +
    //        "AND (:status IS NULL OR g.status = :status) " +
    //        "AND (:categoryId IS NULL OR g.categoryId = :categoryId) " +
    //        "AND (:priority IS NULL OR g.priority = :priority) " +
    //        "AND (CASE WHEN :startDate IS NULL THEN true ELSE g.createdAt >= :startDate END) " +
    //        "AND (CASE WHEN :endDate IS NULL THEN true ELSE g.createdAt <= :endDate END) " +
    //        "ORDER BY g.createdAt DESC")
    // Page<Grievance> findStudentGrievancesWithFilters(
    //     @Param("studentId") Long studentId,
    //     @Param("status") String status,
    //     @Param("categoryId") Long categoryId,
    //     @Param("priority") String priority,
    //     @Param("startDate") LocalDateTime startDate,
    //     @Param("endDate") LocalDateTime endDate,
    //     Pageable pageable);
    
    // DEPRECATED: Staff with CASE WHEN (causes PostgreSQL type inference issues - THIS IS THE PROBLEM!)
    // @Query("SELECT g FROM Grievance g WHERE g.assignedTo = :staffId " +
    //        "AND (:status IS NULL OR g.status = :status) " +
    //        "AND (:departmentId IS NULL OR g.departmentId = :departmentId) " +
    //        "AND (:priority IS NULL OR g.priority = :priority) " +
    //        "AND (CASE WHEN :startDate IS NULL THEN true ELSE g.createdAt >= :startDate END) " +
    //        "AND (CASE WHEN :endDate IS NULL THEN true ELSE g.createdAt <= :endDate END) " +
    //        "ORDER BY g.createdAt DESC")
    // Page<Grievance> findStaffGrievancesWithFilters(
    //     @Param("staffId") Long staffId,
    //     @Param("status") String status,
    //     @Param("departmentId") Long departmentId,
    //     @Param("priority") String priority,
    //     @Param("startDate") LocalDateTime startDate,
    //     @Param("endDate") LocalDateTime endDate,
    //     Pageable pageable);
    
    // ==================== NEW: SORTING SUPPORT ====================
    
    // For dynamic sorting - student grievances
    @Query("SELECT g FROM Grievance g WHERE g.studentId = :studentId " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'createdAt' AND :sortDir = 'asc' THEN g.createdAt END ASC, " +
           "CASE WHEN :sortBy = 'createdAt' AND :sortDir = 'desc' THEN g.createdAt END DESC, " +
           "CASE WHEN :sortBy = 'priority' THEN g.priority END DESC, " +
           "CASE WHEN :sortBy = 'status' THEN g.status END ASC")
    Page<Grievance> findStudentGrievancesSorted(
        @Param("studentId") Long studentId,
        @Param("sortBy") String sortBy,
        @Param("sortDir") String sortDir,
        Pageable pageable);
    
    // ==================== NEW: COUNT METHODS FOR PAGINATION ====================
    
    // Count with filters for student
    @Query("SELECT COUNT(g) FROM Grievance g WHERE g.studentId = :studentId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:categoryId IS NULL OR g.categoryId = :categoryId) " +
           "AND (:priority IS NULL OR g.priority = :priority)")
    Long countStudentGrievancesWithFilters(
        @Param("studentId") Long studentId,
        @Param("status") String status,
        @Param("categoryId") Long categoryId,
        @Param("priority") String priority);
    
    // Count with filters for staff
    @Query("SELECT COUNT(g) FROM Grievance g WHERE g.assignedTo = :staffId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:departmentId IS NULL OR g.departmentId = :departmentId) " +
           "AND (:priority IS NULL OR g.priority = :priority)")
    Long countStaffGrievancesWithFilters(
        @Param("staffId") Long staffId,
        @Param("status") String status,
        @Param("departmentId") Long departmentId,
        @Param("priority") String priority);
    
    // Count with filters for admin
    @Query("SELECT COUNT(g) FROM Grievance g WHERE g.departmentId = :departmentId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:categoryId IS NULL OR g.categoryId = :categoryId) " +
           "AND (:priority IS NULL OR g.priority = :priority)")
    Long countAdminGrievancesWithFilters(
        @Param("departmentId") Long departmentId,
        @Param("status") String status,
        @Param("categoryId") Long categoryId,
        @Param("priority") String priority);
}