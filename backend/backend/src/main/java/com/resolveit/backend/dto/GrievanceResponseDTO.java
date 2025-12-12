package com.resolveit.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class GrievanceResponseDTO {
    private Long id;
    private String grievanceId;
    private String title;
    private String description;
    private String priority;
    private String status;
    
    @JsonProperty("category")
    private String categoryName;
    
    @JsonProperty("department")
    private String departmentName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;
    
    @JsonProperty("assignedTo")
    private String assignedToName;
    private String assignedToEmail;
    
    private Long categoryId;
    private Long departmentId;
    private String studentName;
    private String studentEmail;
    
    // NEW: Add feedback field
    @JsonProperty("feedback")
    private FeedbackDTO feedback;
    
    // Helper method to check if feedback exists
    public boolean hasFeedback() {
        return feedback != null;
    }
}