package com.resolveit.backend.repository;

import com.resolveit.backend.entity.GrievanceTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GrievanceTimelineRepository extends JpaRepository<GrievanceTimeline, Long> {
    List<GrievanceTimeline> findByGrievanceIdOrderByCreatedAtAsc(Long grievanceId);
    List<GrievanceTimeline> findByGrievanceIdOrderByCreatedAtDesc(Long grievanceId);
}