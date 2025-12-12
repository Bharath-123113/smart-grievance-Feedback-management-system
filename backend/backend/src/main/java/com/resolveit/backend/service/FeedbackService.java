package com.resolveit.backend.service;

import com.resolveit.backend.dto.FeedbackDTO;
import com.resolveit.backend.dto.FeedbackRequest;
import com.resolveit.backend.entity.Feedback;
import com.resolveit.backend.entity.Grievance;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.FeedbackRepository;
import com.resolveit.backend.repository.GrievanceRepository;
import com.resolveit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FeedbackService {
    
    private final FeedbackRepository feedbackRepository;
    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
    
    // Submit feedback - CHANGED: Long → String
    public FeedbackDTO submitFeedback(FeedbackRequest request, String userId) {
        // Find grievance
        Grievance grievance = grievanceRepository.findById(request.getGrievanceId())
            .orElseThrow(() -> new RuntimeException("Grievance not found"));
        
        // Check if grievance is resolved
        if (!"resolved".equals(grievance.getStatus())) {
            throw new RuntimeException("Feedback can only be submitted for resolved grievances");
        }
        
        // Find user by userId (String)
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User not found with userId: " + userId));
        
        // Check if user already submitted feedback for this grievance
        feedbackRepository.findByGrievanceIdAndSubmittedById(request.getGrievanceId(), user.getId())
            .ifPresent(f -> {
                throw new RuntimeException("You have already submitted feedback for this grievance");
            });
        
        // Create and save feedback
        Feedback feedback = Feedback.builder()
            .grievance(grievance)
            .rating(request.getRating())
            .comment(request.getComment())
            .submittedBy(user)
            .createdAt(LocalDateTime.now())
            .build();
        
        Feedback savedFeedback = feedbackRepository.save(feedback);
        
        return convertToDTO(savedFeedback);
    }
    
    // Get feedback for a grievance - No change needed
    public List<FeedbackDTO> getFeedbackByGrievance(Long grievanceId) {
        List<Feedback> feedbacks = feedbackRepository.findByGrievanceId(grievanceId);
        return feedbacks.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Get user's feedback history - CHANGED: Long → String
    public List<FeedbackDTO> getUserFeedbackHistory(String userId) {
        // Find user by userId (String) to get their id (Long)
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User not found with userId: " + userId));
        
        List<Feedback> feedbacks = feedbackRepository.findBySubmittedById(user.getId());
        return feedbacks.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Get average rating for grievance - No change needed
    public Double getAverageRating(Long grievanceId) {
        return feedbackRepository.findAverageRatingByGrievanceId(grievanceId);
    }
    
    // Convert entity to DTO
    private FeedbackDTO convertToDTO(Feedback feedback) {
        return FeedbackDTO.builder()
            .id(feedback.getId())
            .grievanceId(feedback.getGrievance().getId())
            .grievanceTitle(feedback.getGrievance().getTitle())
            .rating(feedback.getRating())
            .comment(feedback.getComment())
            .submittedById(feedback.getSubmittedBy().getId())
            .submittedByName(feedback.getSubmittedBy().getFirstName() + " " + feedback.getSubmittedBy().getLastName())
            .createdAt(feedback.getCreatedAt())
            .formattedDate(feedback.getCreatedAt().format(formatter))
            .build();
    }
}