package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class GrievanceAssignmentDTO {
    private Long grievanceId;
    private Long staffId;
    private String notes;
}