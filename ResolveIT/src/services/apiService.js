import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`); // Debug log
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}:`, 
                response.status, response.data?.message || 'Success');
    return response.data;
  },
  (error) => {
    const url = error.config?.url || 'Unknown endpoint';
    const status = error.response?.status;
    const data = error.response?.data;
    
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${url}:`, 
                 status, data?.message || error.message);
    
    // Handle different error statuses
    switch(status) {
      case 401:
        // Unauthorized - session expired
        console.error('🔐 Unauthorized! Redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
        
      case 403:
        // Forbidden - but NOT for feedback submissions
        if (url.includes('/feedback')) {
          // For feedback: don't show generic alert, let the component handle it
          console.warn('📝 Feedback submission rejected (already submitted or not allowed)');
        } else {
          // For other 403 errors
          console.error('⛔ Forbidden: You do not have permission for this action');
          alert('You do not have permission to perform this action.');
        }
        break;
        
      case 404:
        console.error('🔍 Not found:', url);
        break;
        
      case 500:
        console.error('💥 Server error:', data?.message || 'Internal server error');
        alert('Server error. Please try again later.');
        break;
        
      default:
        console.error('❓ Unknown error:', status, data);
        break;
    }
    
    // Return structured error for components to handle
    return Promise.reject({
      status: status,
      message: data?.message || error.message,
      data: data,
      isFeedbackError: url.includes('/feedback') && status === 403
    });
  }
);

// ===== DASHBOARD API METHODS =====

// ADMIN DASHBOARD METHODS
export const adminDashboardApi = {
  // Get department statistics
  getDepartmentStats: () => {
    return apiClient.get('/dashboard/admin/stats');
  },
  
  // Get all grievances in department (LEGACY - will update)
  getDepartmentGrievances: () => {
    return apiClient.get('/dashboard/admin/grievances');
  },
  
  // NEW: Filter grievances (POST method)
  filterGrievances: (filterData) => {
    return apiClient.post('/dashboard/admin/grievances/filter', filterData);
  },
  
  // NEW: Search grievances
  searchGrievances: (keyword, page = 0, size = 10) => {
    return apiClient.get('/dashboard/admin/grievances/search', {
      params: { keyword, page, size }
    });
  },
  
  // NEW: Get paginated grievances
  getPaginatedGrievances: (page = 0, size = 10, status = null) => {
    const params = { page, size };
    if (status) params.status = status;
    return apiClient.get('/dashboard/admin/grievances/paginated', { params });
  },
  
  // Get new/unassigned grievances
  getNewGrievances: () => {
    return apiClient.get('/dashboard/admin/grievances/new');
  },
  
  // Get grievances assigned to current admin
  getMyAssignedGrievances: () => {
    return apiClient.get('/dashboard/admin/grievances/assigned-to-me');
  },
  
  // Assign grievance to admin
  assignGrievanceToMe: (grievanceId) => {
    return apiClient.put(`/dashboard/admin/grievances/${grievanceId}/assign-to-me`);
  },
  
  // Assign grievance to staff
  assignToStaff: (grievanceId, assignmentData) => {
    return apiClient.put(`/dashboard/admin/grievances/${grievanceId}/assign-to-staff`, assignmentData);
  },
  
  // Get department staff
  getDepartmentStaff: () => {
    return apiClient.get('/dashboard/admin/staff');
  },
  
  // Get staff performance
  getStaffPerformance: () => {
    return apiClient.get('/dashboard/admin/staff/performance');
  },
  
  // Get grievance details
  getGrievanceDetails: (grievanceId) => {
    return apiClient.get(`/dashboard/admin/grievances/${grievanceId}`);
  },
  
  // Get grievance details with DTO
  getGrievanceDetailsDTO: (grievanceId) => {
    return apiClient.get(`/dashboard/admin/grievances/${grievanceId}/details`);
  },
  
  // Reject grievance
  rejectGrievance: (grievanceId, reason) => {
    return apiClient.put(`/dashboard/admin/grievances/${grievanceId}/reject`, null, {
      params: { reason }
    });
  },
  
  // Get dashboard summary
  getDashboardSummary: () => {
    return apiClient.get('/dashboard/admin/summary');
  }
};

// STAFF DASHBOARD METHODS
export const staffDashboardApi = {
  // Get staff statistics
  getStaffStats: () => {
    return apiClient.get('/dashboard/staff/stats');
  },
  
  // Get grievances assigned to staff (LEGACY - will update)
  getMyGrievances: () => {
    return apiClient.get('/dashboard/staff/grievances');
  },
  
  // NEW: Filter grievances (GET method with query params)
  filterGrievances: (filters) => {
    // Clean empty parameters before sending
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      // Don't send empty values
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        cleanFilters[key] = filters[key];
      }
    });
    
    return apiClient.get('/dashboard/staff/grievances/filter', { 
      params: cleanFilters 
    });
  },
  
  // NEW: Search grievances
  searchGrievances: (keyword, page = 0, size = 10) => {
    return apiClient.get('/dashboard/staff/grievances/search', {
      params: { keyword, page, size }
    });
  },
  
  // NEW: Get paginated grievances
  getPaginatedGrievances: (page = 0, size = 10, sortBy = 'updatedAt', sortDir = 'desc') => {
    return apiClient.get('/dashboard/staff/grievances', {
      params: { page, size, sortBy, sortDir }
    });
  },
  
  // Get grievances by status
  getGrievancesByStatus: (status) => {
    return apiClient.get(`/dashboard/staff/grievances/status/${status}`);
  },
  
  // Get grievance details
  getGrievanceDetails: (grievanceId) => {
    return apiClient.get(`/dashboard/staff/grievances/${grievanceId}`);
  },
  
  // Update grievance status
  updateGrievanceStatus: (grievanceId, statusData) => {
    return apiClient.put(`/dashboard/staff/grievances/${grievanceId}/status`, statusData);
  },
  
  // Add notes to grievance
  addNotesToGrievance: (grievanceId, notes) => {
    return apiClient.put(`/dashboard/staff/grievances/${grievanceId}/add-notes`, null, {
      params: { notes }
    });
  },
  
  // Get recent activity
  getRecentActivity: () => {
    return apiClient.get('/dashboard/staff/activity');
  },
  
  // Get performance overview
  getPerformanceOverview: () => {
    return apiClient.get('/dashboard/staff/performance');
  },
  
  // NEW: Get priority list
  getPriorityList: () => {
    return apiClient.get('/dashboard/staff/priority-list');
  },
  
  // NEW: Get recent grievances
  getRecentGrievances: () => {
    return apiClient.get('/dashboard/staff/recent-grievances');
  }
};

// STUDENT DASHBOARD METHODS
export const studentDashboardApi = {
  // NEW: Filter grievances (GET method with query params)
  filterGrievances: (filters) => {
    // Clean empty parameters before sending
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      // Don't send empty values (except page/size which have defaults)
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        cleanFilters[key] = filters[key];
      }
    });
    
    return apiClient.get('/dashboard/student/grievances/filter', { 
      params: cleanFilters 
    });
  },
  
  // NEW: Search grievances
  searchGrievances: (keyword, page = 0, size = 10) => {
    return apiClient.get('/dashboard/student/grievances/search', {
      params: { keyword, page, size }
    });
  },
  
  // NEW: Get paginated grievances
  getPaginatedGrievances: (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') => {
    return apiClient.get('/dashboard/student/grievances', {
      params: { page, size, sortBy, sortDir }
    });
  },
  
  // Get dashboard stats
  getDashboardStats: () => {
    return apiClient.get('/dashboard/student/stats');
  },
  
  // Create new grievance
  createGrievance: (grievanceData) => {
    return apiClient.post('/dashboard/student/grievances', grievanceData);
  },
  
  // Get grievance details
  getGrievanceDetails: (grievanceId) => {
    return apiClient.get(`/dashboard/student/grievances/${grievanceId}`);
  }
};

// COMMON DASHBOARD METHODS (for both admin and staff)
export const commonDashboardApi = {
  // Get departments (for dropdowns)
  getDepartments: () => {
    return apiClient.get('/dashboard/student/departments');
  },
  
  // Get categories
  getCategories: () => {
    return apiClient.get('/dashboard/student/categories');
  },
  
  // Get user notifications
  getNotifications: () => {
    return apiClient.get('/dashboard/student/notifications');
  },
  
  // Mark notification as read
  markNotificationAsRead: (notificationId) => {
    return apiClient.put(`/dashboard/student/notifications/${notificationId}/read`);
  }
};

// ===== PROFILE API METHODS =====
export const profileApi = {
  // Get user profile
  getProfile: () => {
    return apiClient.get('/dashboard/student/profile');
  },
  
  // Update profile
  updateProfile: (profileData) => {
    return apiClient.put('/dashboard/student/profile', profileData);
  },
  
  // Change password
  changePassword: (passwordData) => {
    return apiClient.put('/dashboard/student/profile/password', passwordData);
  },
  
  // Update notification preferences
  updateNotifications: (notificationData) => {
    return apiClient.put('/dashboard/student/profile/notifications', notificationData);
  },
  
  // Upload profile picture (UPDATED: Now accepts file)
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/dashboard/student/profile/picture', formData);
  },
  
  // Get profile picture URL
  getProfilePictureUrl: () => {
    return apiClient.get('/dashboard/student/profile/picture-url');
  }
};

// ===== FILE UPLOAD API METHODS =====
export const fileUploadApi = {
  // Upload any file
  uploadFile: (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return apiClient.post('/files/upload', formData);
  },
  
  // Delete file
  deleteFile: (folder, filename) => {
    // Handle cases where filename might have subfolders
    const encodedFolder = encodeURIComponent(folder);
    const encodedFilename = encodeURIComponent(filename);
    return apiClient.delete(`/files/${encodedFolder}/${encodedFilename}`);
  },
  
  // Get file URL (for display)
  getFileUrl: (folder, filename) => {
    const encodedFolder = encodeURIComponent(folder);
    const encodedFilename = encodeURIComponent(filename);
    return `${apiClient.defaults.baseURL}/files/${encodedFolder}/${encodedFilename}`;
  },
  
  // Get full profile picture URL
  getProfilePictureFullUrl: (filePath) => {
    if (!filePath) return null;
    
    console.log('📸 Processing profile picture path:', filePath);
    
    // Handle different possible formats:
    
    // Case 1: Already a full URL (from backend or external)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log('🔗 Already a full URL, returning as-is');
      return filePath;
    }
    
    // Case 2: Relative path starting with /uploads/
    if (filePath.startsWith('/uploads/')) {
      // Convert "/uploads/profile/abc.jpg" to "uploads/profile/abc.jpg"
      const cleanPath = filePath.substring(1);
      const parts = cleanPath.split('/');
      
      if (parts.length >= 2) {
        const folder = parts[0]; // "uploads"
        const filename = parts.slice(1).join('/'); // "profile/abc.jpg"
        console.log(`📁 Extracted folder: ${folder}, filename: ${filename}`);
        
        // Use the fixed getFileUrl without 'this'
        const fileUrl = fileUploadApi.getFileUrl(folder, filename);
        console.log('🔗 Generated URL:', fileUrl);
        return fileUrl;
      }
    }
    
    // Case 3: Just a filename or simple path
    if (filePath.includes('/')) {
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        const folder = parts[0];
        const filename = parts.slice(1).join('/');
        const fileUrl = fileUploadApi.getFileUrl(folder, filename);
        console.log('🔗 Generated URL from simple path:', fileUrl);
        return fileUrl;
      }
    }
    
    // Case 4: Just a filename, assume it's in 'uploads/profile' folder
    console.log('📝 Assuming file is in uploads/profile folder');
    return fileUploadApi.getFileUrl('uploads', `profile/${filePath}`);
  },
  
  // Helper to extract folder and filename from filePath
  parseFilePath: (filePath) => {
    if (!filePath) return { folder: '', filename: '' };
    
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const parts = cleanPath.split('/');
    
    if (parts.length < 2) {
      return { folder: 'uploads', filename: parts[0] || '' };
    }
    
    const folder = parts[0];
    const filename = parts.slice(1).join('/');
    
    return { folder, filename };
  }
};

export default apiClient;