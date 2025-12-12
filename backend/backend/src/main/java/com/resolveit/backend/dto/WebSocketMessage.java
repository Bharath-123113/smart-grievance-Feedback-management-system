package com.resolveit.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessage {
    private String type; // "NEW_REMARK", "STATUS_UPDATE"
    private Long grievanceId;
    private RemarkResponseDTO remark;
    private String sender;
    private LocalDateTime timestamp;
    private Map<String, Object> additionalData; // Add this line
    
    // Constructor for new remark
    public static WebSocketMessage createNewRemarkMessage(Long grievanceId, RemarkResponseDTO remark, String sender) {
        return WebSocketMessage.builder()
                .type("NEW_REMARK")
                .grievanceId(grievanceId)
                .remark(remark)
                .sender(sender)
                .timestamp(LocalDateTime.now())
                .build();
    }
}