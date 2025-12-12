package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Remark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RemarkRepository extends JpaRepository<Remark, Long> {
    
    List<Remark> findByGrievanceIdOrderByCreatedAtDesc(Long grievanceId);
    
    List<Remark> findByGrievanceIdOrderByCreatedAtAsc(Long grievanceId);
    
    @Query("SELECT r FROM Remark r WHERE r.grievance.id = :grievanceId AND (r.isInternal = false OR r.userType = 'student') ORDER BY r.createdAt DESC")
    List<Remark> findVisibleRemarks(@Param("grievanceId") Long grievanceId);
    
    Long countByGrievanceId(Long grievanceId);
    
    Remark findFirstByGrievanceIdOrderByCreatedAtDesc(Long grievanceId);
}