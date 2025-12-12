import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import QuickStats from '../components/Dashboard/QuickStats';
import GrievanceForm from '../components/Dashboard/GrievanceForm';
import GrievanceList from '../components/Dashboard/GrievanceList';
import TrackGrievance from '../components/Dashboard/TrackGrievance';
import GrievanceDetails from '../components/Dashboard/GrievanceDetails';
import PrivacySecurity from '../components/Dashboard/PrivacySecurity';
import HelpSupport from '../components/Dashboard/HelpSupport';
import FeedbackModal from '../components/Dashboard/FeedbackModal';
import NotificationsPage from '../pages/NotificationsPage';
import ProfilePage from '../pages/ProfilePage';

// Import services
import notificationService from '../services/notificationService';
import feedbackService from '../services/feedbackService';
import { studentDashboardApi, commonDashboardApi } from '../services/apiService';
import './StudentDashboard.css';

// NEW: Search Bar Component
const SearchBar = ({ searchKeyword, setSearchKeyword, onSearch, loading }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search grievances by title or description..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="search-input"
        />
        <button 
          className="search-btn" 
          onClick={onSearch}
          disabled={loading}
        >
          {loading ? '🔍' : '🔍'}
        </button>
      </div>
      {searchKeyword && (
        <div className="search-info">
          <span>Searching for: "{searchKeyword}"</span>
          <button 
            className="clear-search"
            onClick={() => {
              setSearchKeyword('');
              onSearch(); // Trigger search with empty keyword to reset
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

const StudentDashboard = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [grievanceForFeedback, setGrievanceForFeedback] = useState(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // States for backend data
  const [stats, setStats] = useState({
    totalGrievances: 0,
    submittedGrievances: 0,
    inProgressGrievances: 0,
    resolvedGrievances: 0,
    rejectedGrievances: 0
  });
  
  const [grievances, setGrievances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // NEW: Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });
  
  // NEW: Filter state
  const [filters, setFilters] = useState({
    status: '',
    categoryId: '',
    priority: '',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });

  // NEW: Separate search state
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // NEW: Show filters in sidebar
  const [showFilters, setShowFilters] = useState(false);

  // ==================== DATA FETCHING ====================

  // Fetch dashboard data with filters
  const fetchDashboardData = async (page = 0, customFilters = null, customSearch = null) => {
    try {
      setLoading(true);
      
      const currentFilters = customFilters || filters;
      const currentSearch = customSearch !== undefined ? customSearch : searchKeyword;
      
      // Fetch statistics
      const statsResponse = await studentDashboardApi.getDashboardStats();
      setStats(statsResponse.data || statsResponse);

      // Fetch grievances with pagination and filters/search
      let grievancesResponse;
      
      if (currentSearch) {
        // Search endpoint (searches only by keyword)
        grievancesResponse = await studentDashboardApi.searchGrievances(
          currentSearch,
          page,
          pagination.size
        );
      } else if (currentFilters.status || currentFilters.categoryId || currentFilters.priority) {
        // Filter endpoint
        const filterParams = {
          ...currentFilters,
          page: page,
          size: pagination.size
        };
        grievancesResponse = await studentDashboardApi.filterGrievances(filterParams);
      } else {
        // Paginated endpoint
        grievancesResponse = await studentDashboardApi.getPaginatedGrievances(
          page,
          pagination.size,
          currentFilters.sortBy,
          currentFilters.sortDirection
        );
      }
      
      // Handle response format (with or without ApiResponse wrapper)
      let grievancesData = [];
      let totalElements = 0;
      let totalPages = 0;
      
      if (grievancesResponse.data && grievancesResponse.data.content) {
        // With ApiResponse wrapper
        grievancesData = grievancesResponse.data.content;
        totalElements = grievancesResponse.data.totalElements || 0;
        totalPages = grievancesResponse.data.totalPages || 0;
      } else if (grievancesResponse.content) {
        // Direct PaginatedResponse
        grievancesData = grievancesResponse.content;
        totalElements = grievancesResponse.totalElements || 0;
        totalPages = grievancesResponse.totalPages || 0;
      } else {
        // Fallback to array
        grievancesData = grievancesResponse.data || grievancesResponse;
      }
      
      console.log('📥 Grievances response:', { 
        data: grievancesData, 
        total: totalElements,
        pages: totalPages 
      });
      
      setGrievances(grievancesData);
      setPagination(prev => ({
        ...prev,
        page: page,
        totalElements: totalElements,
        totalPages: totalPages
      }));

      // Fetch categories for dropdown
      const categoriesResponse = await commonDashboardApi.getCategories();
      setCategories(categoriesResponse.data || categoriesResponse);

      // Fetch departments for dropdown
      const departmentsResponse = await commonDashboardApi.getDepartments();
      setDepartments(departmentsResponse.data || departmentsResponse);
      
      // Fetch notifications using our new service
      await fetchNotifications();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter application from sidebar
  const handleApplyFilters = () => {
    setSearchKeyword(''); // Clear search when applying filters
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    fetchDashboardData(0, filters, ''); // Apply filters, clear search
    setShowFilters(false); // Hide filter panel
    setSidebarOpen(false); // Close sidebar on mobile
  };

  // Handle filter reset from sidebar
  const handleResetFilters = () => {
    const resetFilters = {
      status: '',
      categoryId: '',
      priority: '',
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };
    setFilters(resetFilters);
    setSearchKeyword(''); // Also clear search
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchDashboardData(0, resetFilters, '');
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    // Clear other filters when searching
    const resetFilters = {
      status: '',
      categoryId: '',
      priority: '',
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };
    setFilters(resetFilters);
    fetchDashboardData(0, resetFilters, searchKeyword);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchDashboardData(newPage);
    }
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const notificationsData = await notificationService.getNotifications();
      
      // Format notifications for UI
      if (notificationsData.data) {
        const formattedNotifications = notificationsData.data.map(notification =>
          notificationService.formatNotificationForUI(notification)
        );
        setNotifications(formattedNotifications);
      } else if (Array.isArray(notificationsData)) {
        const formattedNotifications = notificationsData.map(notification =>
          notificationService.formatNotificationForUI(notification)
        );
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  // ==================== FEEDBACK FUNCTIONS ====================

  // Check if grievance already has feedback (including from database)
  const hasFeedback = (grievance) => {
    if (!grievance || !grievance.feedback) {
      return false;
    }
    
    // Check if feedback object has actual data
    if (typeof grievance.feedback === 'object') {
      const hasData = grievance.feedback.rating !== undefined ||
                     grievance.feedback.comment !== undefined ||
                     grievance.feedback.submitted_at !== undefined ||
                     grievance.feedback.fromDatabase === true ||
                     grievance.feedback.alreadySubmitted === true ||
                     Object.keys(grievance.feedback).length > 0;
      
      return hasData;
    }
    
    return false;
  };

  // Get feedback status for a grievance
  const getFeedbackStatus = (grievance) => {
    if (!grievance) return 'unknown';
    
    if (grievance.status !== 'resolved') {
      return 'not_resolved';
    }
    
    if (hasFeedback(grievance)) {
      return 'already_submitted';
    }
    
    return 'can_submit';
  };

  // Enhanced: Check with backend before opening modal
  const handleGiveFeedback = async (grievance) => {
    console.log('📝 handleGiveFeedback called for:', grievance.id, grievance.title);
    
    // Immediate UI check
    if (grievance.status !== 'resolved') {
      alert('⚠️ Feedback can only be submitted for resolved grievances.');
      return;
    }
    
    // Check local state first
    if (hasFeedback(grievance)) {
      alert('✅ You have already submitted feedback for this grievance.');
      return;
    }
    
    // Show loading state
    setFeedbackSubmitting(true);
    
    try {
      // Check with backend for accurate status
      const eligibility = await feedbackService.canSubmitFeedback(grievance.id);
      console.log('Eligibility check result:', eligibility);
      
      if (!eligibility.canSubmit) {
        alert(`⚠️ ${eligibility.reason}`);
        
        // Update local state if backend says feedback exists
        if (eligibility.status === 'already_submitted') {
          updateGrievanceFeedbackState(grievance.id, { alreadySubmitted: true });
        }
        return;
      }
      
      // All checks passed - open modal
      setGrievanceForFeedback(grievance);
      setShowFeedbackModal(true);
      
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      // Fallback - open modal but warn user
      alert('⚠️ Unable to verify feedback status. Proceeding anyway...');
      setGrievanceForFeedback(grievance);
      setShowFeedbackModal(true);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Optimistic update: Immediately update UI, then sync with backend
  const handleFeedbackSubmit = async (feedbackData) => {
    if (!grievanceForFeedback) {
      alert('No grievance selected for feedback');
      return;
    }
    
    const grievanceId = grievanceForFeedback.id;
    console.log('📤 Submitting feedback for grievance:', grievanceId, feedbackData);
    
    try {
      // 1. OPTIMISTIC UPDATE: Immediately update local state
      updateGrievanceFeedbackState(grievanceId, {
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        submitted_at: new Date().toISOString(),
        optimistic: true
      });
      
      // 2. Close modal immediately
      setShowFeedbackModal(false);
      const tempGrievance = grievanceForFeedback;
      setGrievanceForFeedback(null);
      
      // 3. Try backend submission
      const result = await feedbackService.submitFeedback(
        grievanceId,
        feedbackData.rating,
        feedbackData.comment
      );
      
      console.log('✅ Backend submission result:', result);
      
      if (result.success) {
        // Success: Update with real backend data
        updateGrievanceFeedbackState(grievanceId, {
          rating: feedbackData.rating,
          comment: feedbackData.comment,
          submitted_at: new Date().toISOString(),
          id: result.data?.id || Date.now(),
          fromDatabase: true,
          optimistic: false
        });
        
        // Show success message
        alert('✅ Thank you for your feedback! Your response has been recorded.');
        
        // Refresh dashboard to get latest data
        setTimeout(() => fetchDashboardData(pagination.page), 1000);
        
      } else {
        throw new Error(result.message || 'Failed to submit feedback');
      }
      
    } catch (error) {
      console.error('❌ Feedback submission error:', error);
      
      if (error.isAlreadySubmitted || error.message?.includes('already submitted')) {
        alert('✅ You have already submitted feedback for this grievance.');
        updateGrievanceFeedbackState(grievanceId, { alreadySubmitted: true });
      } else if (error.isNotResolved || error.message?.includes('resolved')) {
        alert('⚠️ Feedback can only be submitted for resolved grievances.');
        updateGrievanceFeedbackState(grievanceId, null);
      } else {
        alert(`❌ Failed to submit feedback: ${error.message || 'Please try again'}`);
        updateGrievanceFeedbackState(grievanceId, {
          ...feedbackData,
          submitted_at: new Date().toISOString(),
          unsynced: true,
          error: error.message
        });
      }
    }
  };

  // Helper to update grievance feedback state
  const updateGrievanceFeedbackState = (grievanceId, feedbackData) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        const updatedGrievance = { ...g };
        
        if (feedbackData === null) {
          updatedGrievance.feedback = null;
        } else {
          updatedGrievance.feedback = {
            ...(g.feedback || {}),
            ...feedbackData
          };
        }
        
        return updatedGrievance;
      }
      return g;
    }));
  };

  // Get resolved grievances that can still receive feedback
  const getGrievancesNeedingFeedback = () => {
    return grievances.filter(g => {
      const isResolved = g.status === 'resolved';
      const hasFeedbackAlready = hasFeedback(g);
      return isResolved && !hasFeedbackAlready;
    });
  };

  // Get grievances with submitted feedback
  const getGrievancesWithFeedback = () => {
    return grievances.filter(g => g.status === 'resolved' && hasFeedback(g));
  };

  // ==================== NOTIFICATION FUNCTIONS ====================

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        isRead: true
    })));
      alert('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      alert('✅ All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  // ==================== UPDATED: handleNotificationView function ====================

  const handleNotificationView = async (grievanceId) => {
    console.log('🔔 Notification clicked, looking for grievance ID:', grievanceId);
    
    if (!grievanceId) {
      console.error('❌ No grievance ID provided in notification');
      alert('Cannot find grievance for this notification');
      return;
    }
    
    try {
      const searchId = grievanceId.toString();
      
      // Try to find grievance in current list
      const grievance = grievances.find(g => {
        return (
          g.id?.toString() === searchId ||
          g.grievanceId?.toString() === searchId ||
          g.grievance_id?.toString() === searchId
        );
      });
      
      if (grievance) {
        setSelectedGrievance(grievance);
        setActiveView('grievance-details');
        return;
      }
      
      // Try to fetch from backend
      try {
        const response = await studentDashboardApi.getGrievanceDetails(grievanceId);
        if (response.data) {
          setSelectedGrievance(response.data);
          setActiveView('grievance-details');
          return;
        }
      } catch (apiError) {
        console.log('API fetch failed:', apiError.message);
      }
      
      alert('Grievance not found. It might have been deleted or you don\'t have permission to view it.');
      
    } catch (error) {
      console.error('❌ Error finding grievance:', error);
      alert('Unable to find the grievance. Please try again.');
    }
  };

  // ==================== GRIEVANCE FUNCTIONS ====================

  useEffect(() => {
    fetchDashboardData();
    
    const setupWebSocket = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user.userId) {
            notificationService.setupWebSocket((newNotification) => {
              console.log('New real-time notification:', newNotification);
              const formattedNotification = notificationService.formatNotificationForUI(newNotification);
              setNotifications(prev => [formattedNotification, ...prev]);
              
              if (Notification.permission === 'granted') {
                new Notification('New Notification', {
                  body: newNotification.title,
                  icon: '/notification-icon.png'
                });
              }
            });
          }
        } catch (error) {
          console.error('Error setting up WebSocket:', error);
        }
      }
    };
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    setupWebSocket();
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Create new grievance
  const addGrievance = async (newGrievance) => {
    try {
      // Map frontend data to backend format
      const grievanceData = {
        title: newGrievance.title,
        description: newGrievance.description,
        categoryId: parseInt(newGrievance.category_id),
        departmentId: parseInt(newGrievance.department_id),
        priority: newGrievance.priority
      };
      
      console.log('📤 Submitting grievance data:', grievanceData);
      
      const response = await studentDashboardApi.createGrievance(grievanceData);
      console.log('✅ Grievance response:', response);
      
      // Refresh data after creation
      await fetchDashboardData(pagination.page);
      
      // Find the newly created grievance to select it
      const grievancesResponse = await studentDashboardApi.getPaginatedGrievances(0, 10);
      let latestGrievances = [];
      
      if (grievancesResponse.data && grievancesResponse.data.content) {
        latestGrievances = grievancesResponse.data.content;
      } else if (grievancesResponse.content) {
        latestGrievances = grievancesResponse.content;
      }
      
      if (latestGrievances.length > 0) {
        setSelectedGrievance(latestGrievances[0]);
        setActiveView('grievance-details');
        
        const grievanceId = latestGrievances[0].grievanceId || 
                           latestGrievances[0].grievance_id || 
                           latestGrievances[0].id || 
                           'New';
        
        alert(`✅ Grievance Submitted Successfully!\n\n📋 Grievance ID: ${grievanceId}\n📝 Title: ${latestGrievances[0].title}`);
      } else {
        setActiveView('my-grievances');
        alert('✅ Grievance submitted successfully! Please check "My Grievances" page.');
      }

    } catch (error) {
      console.error('Error creating grievance:', error);
      
      if (error.response?.status === 400) {
        alert(`❌ Validation error: ${error.message || 'Please check your input data.'}`);
      } else if (error.response?.status === 403) {
        alert('❌ You do not have permission to submit grievances.');
      } else if (error.response?.status === 500) {
        alert('❌ Server error. Please try again later.');
      } else {
        alert(`❌ Failed to submit grievance: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Find grievance by ID
  const findGrievanceById = async (grievanceId) => {
    try {
      const foundGrievance = grievances.find(g => 
        g.grievanceId === grievanceId.toUpperCase() || 
        g.id?.toString() === grievanceId ||
        g.grievance_id === grievanceId
      );
      if (foundGrievance) return foundGrievance;
      
      await fetchDashboardData(pagination.page);
      const updatedFound = grievances.find(g => 
        g.grievanceId === grievanceId.toUpperCase() || 
        g.id?.toString() === grievanceId ||
        g.grievance_id === grievanceId
      );
      return updatedFound || null;
    } catch (error) {
      console.error('Error finding grievance:', error);
      return null;
    }
  };

  const handleViewGrievanceDetails = (grievance) => {
    setSelectedGrievance(grievance);
    setActiveView('grievance-details');
  };

  const updateGrievance = async (updatedData) => {
    try {
      await fetchDashboardData(pagination.page);
      setActiveView('my-grievances');
      alert('✅ Grievance updated successfully!');
    } catch (error) {
      console.error('Error updating grievance:', error);
      alert('❌ Failed to update grievance');
    }
  };

  const handleEditGrievance = (grievance) => {
    setSelectedGrievance(grievance);
    setActiveView('edit-grievance');
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setGrievanceForFeedback(null);
    setFeedbackSubmitting(false);
  };

  // ==================== HELPER FUNCTIONS ====================

  // Helper function to format grievances for display in components
  const formatGrievancesForDisplay = (grievancesList) => {
    if (!grievancesList || !Array.isArray(grievancesList)) {
      console.warn('formatGrievancesForDisplay: Invalid input:', grievancesList);
      return [];
    }
    
    return grievancesList.map(g => {
      // Check if feedback exists from backend (direct field)
      const hasBackendFeedback = g.feedback !== null && g.feedback !== undefined;
      
      // Get feedback data if exists
      let feedbackData = null;
      if (hasBackendFeedback) {
        console.log('✅ Found backend feedback for grievance', g.id, ':', g.feedback);
        feedbackData = {
          id: g.feedback.id,
          rating: g.feedback.rating,
          comment: g.feedback.comment,
          submitted_at: g.feedback.createdAt || g.feedback.submitted_at,
          submittedById: g.feedback.submittedById,
          submittedByName: g.feedback.submittedByName,
          fromDatabase: true
        };
      }
      
      return {
        // IDs
        id: g.id,
        grievance_id: g.grievanceId || g.grievance_id || g.id,
        
        // Basic info
        title: g.title || 'Untitled',
        description: g.description || '',
        category: g.categoryName || g.category,
        category_name: g.categoryName || g.category,
        priority: g.priority,
        status: g.status,
        created_at: g.createdAt || g.created_at,
        has_attachments: g.hasAttachments || false,
        assignedToName: g.assignedTo || g.assignedToName || g.assigned_to || 'Not assigned',
        assignedTo: g.assignedTo || g.assignedToName || g.assigned_to || 'Not assigned',
        department: g.departmentName || g.department,
        department_name: g.departmentName || g.department,
        resolvedAt: g.resolvedAt,
        resolutionNotes: g.resolutionNotes,
        
        // UPDATED: Feedback from backend (direct field)
        feedback: feedbackData,
        feedbackStatus: getFeedbackStatus(g)
      };
    });
  };

  // Helper function to format a single grievance for GrievanceDetails component
  const formatSingleGrievanceForDisplay = (grievance) => {
    if (!grievance) return null;
    
    const formattedGrievance = formatGrievancesForDisplay([grievance])[0];
    return formattedGrievance;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowFilters(false);
    closeSidebar();
  };

  // Get sorted grievances for dashboard (newest first)
  const getSortedGrievances = () => {
    return [...grievances].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
  };

  // ==================== PAGINATION COMPONENT ====================
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className="pagination-controls">
        <button
          className="btn-small"
          disabled={pagination.page === 0}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          ← Previous
        </button>
        
        <span className="page-info">
          Page {pagination.page + 1} of {pagination.totalPages}
          <span className="total-items"> ({pagination.totalElements} total items)</span>
        </span>
        
        <button
          className="btn-small"
          disabled={pagination.page >= pagination.totalPages - 1}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next →
        </button>
      </div>
    );
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderActiveView = () => {
    if (loading && activeView === 'dashboard') {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      );
    }

    const formattedGrievances = formatGrievancesForDisplay(grievances);
    const sortedGrievances = getSortedGrievances();
    const formattedSortedGrievances = formatGrievancesForDisplay(sortedGrievances);
    const recentGrievances = formattedSortedGrievances.slice(0, 3);
    const grievancesNeedingFeedback = getGrievancesNeedingFeedback();
    const grievancesWithFeedback = getGrievancesWithFeedback();

    switch (activeView) {
      case 'notifications':
        return (
          <div className="view-container">
            <NotificationsPage
              notifications={notifications}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onClearAll={clearAllNotifications}
              onViewGrievance={handleNotificationView}
              onBack={() => setActiveView('dashboard')}
            />
          </div>
        );
      case 'new-grievance':
        return (
          <div className="view-container">
            <h2 className="view-title">Submit New Grievance</h2>
            <GrievanceForm
              categories={categories}
              departments={departments}
              onGrievanceSubmit={addGrievance}
            />
          </div>
        );
      case 'edit-grievance':
        return (
          <div className="view-container">
            <h2 className="view-title">Edit Grievance</h2>
            <GrievanceForm
              categories={categories}
              departments={departments}
              onGrievanceSubmit={updateGrievance}
              editGrievance={selectedGrievance}
            />
          </div>
        );
      case 'my-grievances':
        return (
          <div className="view-container">
            <h2 className="view-title">My Grievances</h2>
            
            {/* Search Bar */}
            <SearchBar
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSearch={handleSearch}
              loading={loading}
            />
            
            {/* Grievance List */}
            <GrievanceList
              grievances={formattedGrievances}
              categories={categories}
              onViewDetails={handleViewGrievanceDetails}
              onEditGrievance={handleEditGrievance}
              onGiveFeedback={handleGiveFeedback}
              feedbackSubmitting={feedbackSubmitting}
            />
            
            {/* Pagination Controls */}
            <PaginationControls />
          </div>
        );
      case 'track-grievance':
        return (
          <div className="view-container">
            <h2 className="view-title">Track Grievance Status</h2>
            <TrackGrievance
              onFindGrievance={findGrievanceById}
              onViewDetails={handleViewGrievanceDetails}
            />
          </div>
        );
      case 'grievance-details':
        return (
          <div className="view-container">
            <GrievanceDetails
              grievance={formatSingleGrievanceForDisplay(selectedGrievance)}
              onBack={() => setActiveView('my-grievances')}
              onGiveFeedback={handleGiveFeedback}
            />
          </div>
        );
      case 'quick-stats':
        return (
          <div className="view-container">
            <h2 className="view-title">Quick Stats</h2>
            <QuickStats 
              stats={stats}
              grievances={formattedGrievances}
            />
          </div>
        );
      case 'privacy-security':
        return (
          <div className="view-container">
            <PrivacySecurity user={user} />
          </div>
        );
      case 'help-support':
        return (
          <div className="view-container">
            <HelpSupport />
          </div>
        );
      case 'profile':
        return (
          <div className="view-container">
            <ProfilePage
              user={user}
              onBack={() => setActiveView('dashboard')}
            />
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="dashboard-main">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-content">
                <h1>Hello, {user?.first_name || 'Student'}! 👋</h1>
                <p>We're here to help resolve your academic concerns quickly and efficiently.</p>
              </div>
              <div className="welcome-actions">
                <button
                  className="action-btn primary"
                  onClick={() => handleViewChange('new-grievance')}
                >
                  📝 Submit New Grievance
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => handleViewChange('track-grievance')}
                >
                  🔍 Track Grievance
                </button>
                <button
                  className="action-btn tertiary"
                  onClick={() => handleViewChange('my-grievances')}
                >
                  📋 View All Grievances
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-section">
              <QuickStats 
                stats={stats}
                grievances={formattedGrievances}
              />
            </div>

            {/* Feedback Reminder */}
            {grievancesNeedingFeedback.length > 0 && (
              <div className="feedback-reminder-card">
                <div className="feedback-reminder-header">
                  <h3>💬 Feedback Needed</h3>
                  <span className="badge">{grievancesNeedingFeedback.length}</span>
                </div>
                <p>You have {grievancesNeedingFeedback.length} resolved grievance(s) waiting for your feedback.</p>
                <button
                  className="action-btn primary"
                  onClick={() => handleViewChange('my-grievances')}
                >
                  Give Feedback
                </button>
              </div>
            )}

            {/* Feedback Submitted Success */}
            {grievancesWithFeedback.length > 0 && (
              <div className="feedback-success-card">
                <div className="feedback-success-header">
                  <h3>✅ Feedback Submitted</h3>
                  <span className="badge success">{grievancesWithFeedback.length}</span>
                </div>
                <p>You have submitted feedback for {grievancesWithFeedback.length} resolved grievance(s). Thank you!</p>
                <div className="feedback-success-details">
                  Average rating: {
                    (grievancesWithFeedback.reduce((sum, g) => sum + (g.feedback?.rating || 0), 0) / 
                    Math.max(grievancesWithFeedback.length, 1)).toFixed(1)
                  } ⭐
                </div>
              </div>
            )}

            {/* Notification Reminder */}
            {getUnreadNotificationCount() > 0 && (
              <div className="notification-reminder-card">
                <div className="notification-reminder-header">
                  <h3>🔔 New Notifications</h3>
                  <span className="badge">{getUnreadNotificationCount()}</span>
                </div>
                <p>You have {getUnreadNotificationCount()} unread notification(s).</p>
                <button
                  className="action-btn primary"
                  onClick={() => setActiveView('notifications')}
                >
                  View Notifications
                </button>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="main-content-grid">
              {/* Recent Grievances */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>📋 Recent Grievances</h3>
                  <button
                    className="view-all-btn"
                    onClick={() => handleViewChange('my-grievances')}
                  >
                    View All →
                  </button>
                </div>
                <GrievanceList
                  grievances={recentGrievances}
                  categories={categories}
                  compact={true}
                  onViewDetails={handleViewGrievanceDetails}
                  onGiveFeedback={handleGiveFeedback}
                  feedbackSubmitting={feedbackSubmitting}
                />
                {grievances.length === 0 && (
                  <div className="empty-state">
                    <p>No grievances submitted yet.</p>
                    <button
                      className="action-btn primary"
                      onClick={() => handleViewChange('new-grievance')}
                    >
                      Submit Your First Grievance
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="student-dashboard">
      <Header
        user={user}
        onLogout={onLogout}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        notifications={notifications}
        unreadCount={getUnreadNotificationCount()}
        onNotificationView={handleNotificationView}
        onViewAllNotifications={() => setActiveView('notifications')}
        onMarkNotificationAsRead={markNotificationAsRead}
        onViewProfile={() => setActiveView('profile')}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        user={user}
        activeView={activeView}
        setActiveView={handleViewChange}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        categories={categories}
      />

      <main className="dashboard-content">
        {renderActiveView()}
      </main>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          grievance={grievanceForFeedback}
          onSubmit={handleFeedbackSubmit}
          onClose={handleCloseFeedbackModal}
          isSubmitting={feedbackSubmitting}
        />
      )}
    </div>
  );
};

export default StudentDashboard;