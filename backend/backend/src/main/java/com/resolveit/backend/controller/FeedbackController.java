package com.resolveit.backend.controller;

import com.resolveit.backend.dto.ApiResponse;
import com.resolveit.backend.dto.FeedbackDTO;
import com.resolveit.backend.dto.FeedbackRequest;
import com.resolveit.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    
    private final FeedbackService feedbackService;
    
    // Submit feedback for a grievance
    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackDTO>> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal String userId) {  // Changed from Long to String
        
        FeedbackDTO feedback = feedbackService.submitFeedback(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully", feedback));
    }
    
    // Get feedback for a specific grievance
    @GetMapping("/grievance/{grievanceId}")
    public ResponseEntity<ApiResponse<List<FeedbackDTO>>> getGrievanceFeedback(
            @PathVariable Long grievanceId) {
        
        List<FeedbackDTO> feedback = feedbackService.getFeedbackByGrievance(grievanceId);
        return ResponseEntity.ok(ApiResponse.success(feedback));
    }
    
    // Get user's feedback history
    @GetMapping("/my-feedback")
    public ResponseEntity<ApiResponse<List<FeedbackDTO>>> getMyFeedbackHistory(
            @AuthenticationPrincipal String userId) {  // Changed from Long to String
        
        List<FeedbackDTO> feedback = feedbackService.getUserFeedbackHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(feedback));
    }
    
    // Get average rating for grievance
    @GetMapping("/grievance/{grievanceId}/average-rating")
    public ResponseEntity<ApiResponse<Double>> getAverageRating(
            @PathVariable Long grievanceId) {
        
        Double averageRating = feedbackService.getAverageRating(grievanceId);
        return ResponseEntity.ok(ApiResponse.success(averageRating));
    }
}  