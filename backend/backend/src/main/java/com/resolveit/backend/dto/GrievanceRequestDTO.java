// src/main/java/com/resolveit/backend/dto/GrievanceRequestDTO.java
package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class GrievanceRequestDTO {
    private String title;
    private String description;
    private Long categoryId;
    private Long departmentId;
    private String priority; // low, medium, high, urgent
}