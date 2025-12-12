package com.resolveit.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceTimelineDTO {
    private Long id;
    private String status;
    private String note;
    private String updatedByName;
    private LocalDateTime createdAt;
    private String formattedTime;
}