package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Feedback;
import com.resolveit.backend.entity.Grievance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    // Find feedback by grievance
    List<Feedback> findByGrievanceId(Long grievanceId);
    
    // Find feedback by user who submitted it
    List<Feedback> findBySubmittedById(Long userId);
    
    // Find specific feedback by grievance and user
    Optional<Feedback> findByGrievanceIdAndSubmittedById(Long grievanceId, Long userId);
    
    // Get average rating for a grievance
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.grievance.id = :grievanceId")
    Double findAverageRatingByGrievanceId(@Param("grievanceId") Long grievanceId);
    
    // Count feedback for a grievance
    Long countByGrievanceId(Long grievanceId);
    
    // Find all feedback with pagination
    List<Feedback> findAllByOrderByCreatedAtDesc();
}