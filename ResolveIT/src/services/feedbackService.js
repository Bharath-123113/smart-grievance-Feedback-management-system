import apiClient from './apiService';

const feedbackService = {
  // Submit feedback for a grievance - ENHANCED with proper error handling
  submitFeedback: async (grievanceId, rating, comment) => {
    try {
      console.log(`📝 Submitting feedback for grievance ${grievanceId}:`, { rating, comment });
      
      const feedbackData = {
        grievanceId: grievanceId,
        rating: rating,
        comment: comment
      };
      
      const response = await apiClient.post('/feedback', feedbackData);
      
      console.log('✅ Feedback submitted successfully:', response);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Feedback submitted successfully'
      };
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      
      // Return structured error object
      throw {
        success: false,
        status: error.status || 500,
        message: error.message || 'Failed to submit feedback',
        isAlreadySubmitted: error.isFeedbackError || error.message?.includes('already submitted'),
        isNotResolved: error.message?.includes('resolved') && error.message?.includes('only'),
        data: error.data
      };
    }
  },

  // Get feedback for a specific grievance
  getGrievanceFeedback: async (grievanceId) => {
    try {
      console.log(`📋 Fetching feedback for grievance ${grievanceId}`);
      const response = await apiClient.get(`/feedback/grievance/${grievanceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching grievance feedback:', error);
      // Return empty array if no feedback exists (404) or error
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get user's feedback history
  getMyFeedbackHistory: async () => {
    try {
      console.log('📚 Fetching user feedback history');
      const response = await apiClient.get('/feedback/my-feedback');
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      // Return empty array on error
      return [];
    }
  },

  // Get average rating for a grievance
  getAverageRating: async (grievanceId) => {
    try {
      const response = await apiClient.get(`/feedback/grievance/${grievanceId}/average-rating`);
      return response.data;
    } catch (error) {
      console.error('Error fetching average rating:', error);
      return null;
    }
  },

  // Check if user can submit feedback (grievance is resolved and no feedback yet)
  canSubmitFeedback: async (grievanceId) => {
    try {
      console.log(`🔍 Checking feedback eligibility for grievance ${grievanceId}`);
      
      // First get the grievance status
      const grievanceResponse = await apiClient.get(`/dashboard/student/grievances/${grievanceId}`);
      const grievance = grievanceResponse.data || grievanceResponse;
      
      if (!grievance) {
        return { 
          canSubmit: false, 
          reason: 'Grievance not found',
          status: 'not_found'
        };
      }
      
      if (grievance.status !== 'resolved') {
        return { 
          canSubmit: false, 
          reason: 'Grievance is not resolved yet',
          status: 'not_resolved',
          currentStatus: grievance.status
        };
      }
      
      // Check if feedback already exists
      try {
        const feedbackResponse = await feedbackService.getGrievanceFeedback(grievanceId);
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (feedbackResponse && feedbackResponse.length > 0) {
          // Check if current user already submitted feedback
          const userFeedback = feedbackResponse.find(f => 
            f.submittedById === user?.id || 
            f.submittedByName?.includes(user?.first_name)
          );
          
          if (userFeedback) {
            return { 
              canSubmit: false, 
              reason: 'You already submitted feedback',
              status: 'already_submitted',
              existingFeedback: userFeedback
            };
          }
        }
      } catch (feedbackError) {
        // If we can't fetch feedback, assume none exists
        console.log('Could not fetch existing feedback, assuming none exists:', feedbackError);
      }
      
      return { 
        canSubmit: true,
        status: 'can_submit',
        grievance: grievance
      };
      
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      return { 
        canSubmit: false, 
        reason: 'Error checking eligibility',
        status: 'error',
        error: error.message
      };
    }
  },

  // NEW: Check feedback status for a grievance
  getFeedbackStatus: async (grievanceId) => {
    try {
      // Try to get existing feedback first
      const feedbackList = await feedbackService.getGrievanceFeedback(grievanceId);
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (feedbackList && feedbackList.length > 0) {
        // Check if current user submitted feedback
        const userFeedback = feedbackList.find(f => 
          f.submittedById === user?.id || 
          f.submittedByName?.includes(user?.first_name)
        );
        
        if (userFeedback) {
          return {
            status: 'already_submitted',
            feedback: userFeedback,
            message: 'You have already submitted feedback'
          };
        }
      }
      
      // Check if grievance is resolved
      const grievanceResponse = await apiClient.get(`/dashboard/student/grievances/${grievanceId}`);
      const grievance = grievanceResponse.data || grievanceResponse;
      
      if (grievance.status !== 'resolved') {
        return {
          status: 'not_resolved',
          message: 'Grievance is not resolved yet'
        };
      }
      
      return {
        status: 'can_submit',
        message: 'You can submit feedback'
      };
      
    } catch (error) {
      console.error('Error getting feedback status:', error);
      return {
        status: 'error',
        message: 'Could not determine feedback status'
      };
    }
  }
};

export default feedbackService;