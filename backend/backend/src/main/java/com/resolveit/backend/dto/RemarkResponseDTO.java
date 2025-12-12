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
public class RemarkResponseDTO {
    private Long id;
    private String message;
    private String userName;
    private String userType;
    private Boolean isInternal;
    private LocalDateTime createdAt;
    private String formattedTime;
}