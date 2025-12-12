package com.resolveit.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GrievanceFilterRequest {
    private Integer page = 0;
    private Integer size = 10;
    private String status;
    private Long categoryId;
    private Long departmentId;
    private String priority;
    private String searchKeyword;
    private LocalDate startDate;
    private LocalDate endDate;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
}