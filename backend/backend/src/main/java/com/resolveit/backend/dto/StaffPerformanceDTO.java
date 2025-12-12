package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class StaffPerformanceDTO {
    private Long staffId;
    private String staffName;
    private String staffEmail;
    private Long assignedGrievances;
    private Long resolvedGrievances;
    private Long pendingGrievances;
    private Double resolutionRate; // percentage
    private Long avgResolutionTime; // in hours
}