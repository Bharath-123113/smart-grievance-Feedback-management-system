// src/main/java/com/resolveit/backend/dto/DashboardStatsDTO.java
package com.resolveit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalGrievances;
    private long submittedGrievances;
    private long inProgressGrievances;
    private long resolvedGrievances;
    private long rejectedGrievances;
}