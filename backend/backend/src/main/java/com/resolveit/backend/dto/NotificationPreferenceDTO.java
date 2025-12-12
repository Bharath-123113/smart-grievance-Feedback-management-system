package com.resolveit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDTO {
    private Boolean pushNotifications;
    private Boolean emailNotifications;
    private Boolean statusUpdates;
    private Boolean newRemarks;
    private Boolean grievanceResolved;
    private Boolean feedbackReminders;
}