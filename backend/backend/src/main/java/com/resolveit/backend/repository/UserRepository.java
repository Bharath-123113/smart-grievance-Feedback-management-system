package com.resolveit.backend.repository;

import com.resolveit.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Authentication and user lookup
    Optional<User> findByUserId(String userId);
    Optional<User> findByEmail(String email);
    Optional<User> findByUserIdAndRole(String userId, String role);
    boolean existsByUserId(String userId);
    boolean existsByEmail(String email);
    
    // Department queries (for dashboards)
    List<User> findByDepartmentId(Integer departmentId);
    List<User> findByDepartmentIdAndRole(Integer departmentId, String role);
    
    // Role queries
    List<User> findByRole(String role);
    
    // Status queries
    List<User> findByIsActiveTrue();
    List<User> findByIsActiveTrueAndRole(String role);
    
    // Counting methods (for dashboard statistics)
    long countByRole(String role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.departmentId = :departmentId AND u.role = :role")
    long countByDepartmentIdAndRole(@Param("departmentId") Integer departmentId, @Param("role") String role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.departmentId = :departmentId")
    long countByDepartmentId(@Param("departmentId") Integer departmentId);
    
    // Find by multiple criteria (for filtering)
    @Query("SELECT u FROM User u WHERE u.departmentId = :departmentId AND u.role = :role AND u.isActive = true")
    List<User> findActiveUsersByDepartmentAndRole(@Param("departmentId") Integer departmentId, @Param("role") String role);
    
    // Search users (for admin to find staff)
    @Query("SELECT u FROM User u WHERE " +
           "(:searchTerm IS NULL OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.userId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND u.departmentId = :departmentId " +
           "AND u.role = :role")
    List<User> searchUsersInDepartmentByRole(
            @Param("departmentId") Integer departmentId,
            @Param("role") String role,
            @Param("searchTerm") String searchTerm);
}