package com.resolveit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    private Long id;
    private Long grievanceId;
    private String grievanceTitle;
    private Integer rating;
    private String comment;
    private Long submittedById;
    private String submittedByName;
    private LocalDateTime createdAt;
    
    // For response - additional fields
    private String formattedDate;
}