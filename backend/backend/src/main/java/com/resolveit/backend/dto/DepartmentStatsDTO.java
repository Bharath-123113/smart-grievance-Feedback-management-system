package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class DepartmentStatsDTO {
    private Long totalGrievances;
    private Long newGrievances; // submitted
    private Long assignedToAdmin;
    private Long assignedToStaff;
    private Long inProgress;
    private Long resolved;
    private Long rejected;
    private Long avgResolutionTime; // in hours
    private Long staffCount;
}