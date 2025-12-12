import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";
import { adminDashboardApi, commonDashboardApi } from "../services/apiService";

// NEW: Search Bar Component for Admin
const AdminSearchBar = ({ searchKeyword, setSearchKeyword, onSearch, loading }) => {
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
          placeholder="Search grievances by title, description, or ID..."
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
          {loading ? '🔍' : '🔍 Search'}
        </button>
      </div>
      {searchKeyword && (
        <div className="search-info">
          <span>Searching for: "{searchKeyword}"</span>
          <button 
            className="clear-search"
            onClick={() => {
              setSearchKeyword('');
              onSearch();
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State for real data
  const [stats, setStats] = useState({
    totalGrievances: 0,
    newGrievances: 0,
    assignedToAdmin: 0,
    assignedToStaff: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    staffCount: 0
  });
  
  const [grievances, setGrievances] = useState([]);
  const [newGrievances, setNewGrievances] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [summary, setSummary] = useState({});
  const [categories, setCategories] = useState([]);
  
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
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  });

  // NEW: Separate search state
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // NEW: Show filters in sidebar
  const [showFilters, setShowFilters] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setShowFilters(false);
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await commonDashboardApi.getCategories();
      if (response.data) {
        setCategories(response.data);
      } else {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await adminDashboardApi.getDepartmentStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
      // Fetch new grievances
      const newGrievancesResponse = await adminDashboardApi.getNewGrievances();
      if (newGrievancesResponse.success) {
        setNewGrievances(newGrievancesResponse.data || []);
      }
      
      // Fetch summary
      const summaryResponse = await adminDashboardApi.getDashboardSummary();
      if (summaryResponse.success) {
        setSummary(summaryResponse.data || {});
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      alert("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all grievances with filters
  const fetchGrievances = async (page = 0, customFilters = null, customSearch = null) => {
    try {
      setLoading(true);
      
      const currentFilters = customFilters || filters;
      const currentSearch = customSearch !== undefined ? customSearch : searchKeyword;
      
      let response;
      
      if (currentSearch) {
        // Search endpoint (searches only by keyword)
        response = await adminDashboardApi.searchGrievances(
          currentSearch,
          page,
          pagination.size
        );
      } else if (currentFilters.status || currentFilters.categoryId || currentFilters.priority ||
                currentFilters.startDate || currentFilters.endDate) {
        
        // Use filter endpoint (POST with JSON body)
        const filterData = {
          ...currentFilters,
          page: page,
          size: pagination.size
        };
        response = await adminDashboardApi.filterGrievances(filterData);
      } else {
        // Use paginated endpoint
        response = await adminDashboardApi.getPaginatedGrievances(
          page,
          pagination.size,
          currentFilters.status
        );
      }
      
      // Handle response format
      let grievancesData = [];
      let totalElements = 0;
      let totalPages = 0;
      
      if (response.data && response.data.content) {
        // With ApiResponse wrapper
        grievancesData = response.data.content;
        totalElements = response.data.totalElements || 0;
        totalPages = response.data.totalPages || 0;
      } else if (response.content) {
        // Direct PaginatedResponse
        grievancesData = response.content;
        totalElements = response.totalElements || 0;
        totalPages = response.totalPages || 0;
      } else {
        // Fallback to array
        grievancesData = response.data || response;
      }
      
      console.log('📥 Admin grievances response:', { 
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
      
    } catch (error) {
      console.error("Error fetching grievances:", error);
      alert("Failed to load grievances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff members
  const fetchStaff = async () => {
    try {
      const response = await adminDashboardApi.getDepartmentStaff();
      if (response.success) {
        setStaffMembers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  // Fetch staff performance
  const fetchStaffPerformance = async () => {
    try {
      const response = await adminDashboardApi.getStaffPerformance();
      if (response.success) {
        setStaffPerformance(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff performance:", error);
    }
  };

  // Handle filter application from sidebar
  const handleApplyFilters = () => {
    setSearchKeyword(''); // Clear search when applying filters
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    fetchGrievances(0, filters, ''); // Apply filters, clear search
    setShowFilters(false); // Hide filter panel
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // Handle filter reset from sidebar
  const handleResetFilters = () => {
    const resetFilters = {
      status: '',
      categoryId: '',
      priority: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    };
    setFilters(resetFilters);
    setSearchKeyword(''); // Also clear search
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchGrievances(0, resetFilters, '');
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    // Clear other filters when searching
    const resetFilters = {
      status: '',
      categoryId: '',
      priority: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    };
    setFilters(resetFilters);
    fetchGrievances(0, resetFilters, searchKeyword);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchGrievances(newPage);
    }
  };

  // Fetch data based on active view
  useEffect(() => {
    fetchCategories();
    
    switch(activeView) {
      case "dashboard":
        fetchDashboardData();
        break;
      case "grievances":
        fetchGrievances(pagination.page);
        break;
      case "staff":
        fetchStaff();
        break;
      case "assign-grievance":
        if (selectedGrievance) {
          fetchStaff(); // To populate staff dropdown
        }
        break;
      default:
        break;
    }
  }, [activeView, selectedGrievance]);

  // Assign grievance to admin
  const assignToMe = async (grievanceId) => {
    try {
      setLoading(true);
      const response = await adminDashboardApi.assignGrievanceToMe(grievanceId);
      if (response.success) {
        alert("✅ Grievance assigned to you!");
        // Refresh data
        fetchDashboardData();
        fetchGrievances(pagination.page);
      } else {
        alert(`Failed to assign: ${response.message}`);
      }
    } catch (error) {
      console.error("Error assigning grievance:", error);
      alert("Failed to assign grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Assign grievance to staff
  const assignToStaff = async (grievanceId, staffId, notes = "") => {
    try {
      setLoading(true);
      const response = await adminDashboardApi.assignToStaff(grievanceId, {
        staffId: staffId,
        notes: notes
      });
      
      if (response.success) {
        alert("✅ Grievance assigned to staff!");
        // Reset and go back to dashboard
        setAssignStaffId("");
        setSelectedGrievance(null);
        setActiveView("dashboard");
        // Refresh data
        fetchDashboardData();
        fetchGrievances(pagination.page);
      } else {
        alert(`Failed to assign: ${response.message}`);
      }
    } catch (error) {
      console.error("Error assigning to staff:", error);
      alert("Failed to assign grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reject grievance
  const rejectGrievance = async (grievanceId, reason) => {
    if (!reason || reason.trim() === "") {
      alert("Please provide a reason for rejection");
      return;
    }
    
    try {
      setLoading(true);
      const response = await adminDashboardApi.rejectGrievance(grievanceId, reason);
      if (response.success) {
        alert("✅ Grievance rejected!");
        fetchDashboardData();
        fetchGrievances(pagination.page);
      } else {
        alert(`Failed to reject: ${response.message}`);
      }
    } catch (error) {
      console.error("Error rejecting grievance:", error);
      alert("Failed to reject grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'submitted': return '🆕 New';
      case 'assigned_to_admin': return '👨‍💼 Assigned to Admin';
      case 'assigned_to_staff': return '👨‍💼 Assigned to Staff';
      case 'in_progress': return '🔄 In Progress';
      case 'resolved': return '✅ Resolved';
      case 'rejected': return '❌ Rejected';
      default: return status;
    }
  };

  // Get priority badge class
  const getPriorityClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  // Handle view changes
  const handleViewChange = (view) => {
    setActiveView(view);
    setShowFilters(false);
    closeSidebar();
  };

  // Handle filter click
  const handleFilterClick = () => {
    setShowFilters(!showFilters);
    setActiveView("grievances"); // Switch to grievances view when filtering
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch(action) {
      case "Manage Staff":
        setActiveView("staff");
        fetchStaffPerformance();
        break;
      case "View Analytics":
        setActiveView("analytics");
        break;
      default:
        alert(`Action: ${action}`);
    }
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

  return (
    <div className="dept-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className={`hamburger-btn ${isSidebarOpen ? "open" : ""}`}
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div>
            <h1>ResolveIT</h1>
            <span className="user-role">
              DEPARTMENT ADMIN DASHBOARD
            </span>
          </div>
        </div>

        <div className="header-right">
          <span>Welcome, {user.first_name} {user.last_name}</span>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* OVERLAY */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      ></div>

      <div className="dashboard-content">
        {/* SIDEBAR */}
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-menu">
            <h4>Main Navigation</h4>

            <div
              className={`menu-item ${activeView === "dashboard" ? "active" : ""}`}
              onClick={() => handleViewChange("dashboard")}
            >
              📊 Dashboard
            </div>

            <div
              className={`menu-item ${activeView === "grievances" ? "active" : ""}`}
              onClick={() => handleViewChange("grievances")}
            >
              📋 All Grievances
            </div>

            <div
              className={`menu-item ${showFilters ? "active" : ""}`}
              onClick={handleFilterClick}
            >
              🔍 Filters
            </div>

            <div
              className={`menu-item ${activeView === "staff" ? "active" : ""}`}
              onClick={() => {
                handleViewChange("staff");
                fetchStaffPerformance();
              }}
            >
              👥 Staff Management
            </div>

            <div
              className={`menu-item ${activeView === "analytics" ? "active" : ""}`}
              onClick={() => handleViewChange("analytics")}
            >
              📈 Analytics
            </div>

            {/* Filter Panel (shown when filters is active) */}
            {showFilters && (
              <div className="filter-panel-sidebar">
                <div className="filter-panel-header">
                  <h4>Filter Grievances</h4>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters?.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="assigned_to_admin">Assigned to Admin</option>
                    <option value="assigned_to_staff">Assigned to Staff</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Priority</label>
                  <select
                    value={filters?.priority || ''}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {categories.length > 0 && (
                  <div className="filter-group">
                    <label>Category</label>
                    <select
                      value={filters?.categoryId || ''}
                      onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="filter-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={filters?.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={filters?.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label>Sort By</label>
                  <select
                    value={filters?.sortBy || 'createdAt'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="filter-select"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                <div className="filter-actions">
                  <button className="filter-btn apply" onClick={handleApplyFilters}>
                    Apply Filters
                  </button>
                  <button className="filter-btn reset" onClick={handleResetFilters}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            <h4>Admin Controls</h4>

            <div className="menu-item">
              ⚙️ Settings
            </div>

            <div className="menu-item">
              📊 Reports
            </div>

            <h4>Support</h4>

            <div className="menu-item">
              🔔 Notifications
            </div>

            <div className="menu-item">
              👤 My Profile
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner">Loading...</div>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {activeView === "dashboard" && (
            <>
              <div className="welcome-section">
                <h1>Hello, {user.first_name}!</h1>
                <p>Manage your department grievances efficiently.</p>
              </div>

              <div className="quick-actions">
                <button
                  className="action-btn"
                  onClick={() => handleQuickAction("Manage Staff")}
                >
                  👥 Manage Staff
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleViewChange("grievances")}
                >
                  📋 View All Grievances
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleQuickAction("View Analytics")}
                >
                  📈 Analytics
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{stats.totalGrievances}</h3>
                  <p>Total Grievances</p>
                </div>

                <div className="stat-card">
                  <h3>{stats.newGrievances}</h3>
                  <p>New Grievances</p>
                </div>

                <div className="stat-card">
                  <h3>{stats.inProgress + stats.assignedToAdmin + stats.assignedToStaff}</h3>
                  <p>In Progress</p>
                </div>

                <div className="stat-card">
                  <h3>{stats.resolved}</h3>
                  <p>Resolved</p>
                </div>
              </div>

              {/* Recent Grievances Section */}
              <div className="recent-grievances">
                <h2>New Grievances - Need Assignment</h2>
                {newGrievances.length === 0 ? (
                  <div className="empty-state">
                    <p>No new grievances to assign. 🎉</p>
                  </div>
                ) : (
                  <div className="grievance-list">
                    {newGrievances.slice(0, 3).map((g) => (
                      <div className="grievance-item" key={g.id}>
                        <h3>{g.title}</h3>
                        <p>{g.description}</p>
                        <div className="grievance-meta">
                          <span><strong>ID:</strong> {g.grievanceId}</span>
                          <span><strong>Priority:</strong> 
                            <span className={getPriorityClass(g.priority)}>
                              {g.priority}
                            </span>
                          </span>
                          <span><strong>Status:</strong> {getStatusDisplay(g.status)}</span>
                          <span><strong>Created:</strong> {formatDate(g.createdAt)}</span>
                        </div>
                        <div className="grievance-actions">
                          <button
                            className="btn-small btn-primary"
                            onClick={() => assignToMe(g.id)}
                          >
                            👤 Assign to Me
                          </button>
                          <button
                            className="btn-small btn-secondary"
                            onClick={() => {
                              setSelectedGrievance(g);
                              setActiveView("assign-grievance");
                            }}
                          >
                            📋 View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ALL GRIEVANCES VIEW */}
          {activeView === "grievances" && (
            <div>
              <h1>All Grievances</h1>
              <p>View and manage grievances in your department.</p>

              {/* Search Bar */}
              <AdminSearchBar
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
                onSearch={handleSearch}
                loading={loading}
              />

              {loading ? (
                <div className="loading">Loading grievances...</div>
              ) : (
                <>
                  <div className="grievance-list">
                    {grievances.map((g) => (
                      <div className="grievance-item" key={g.id}>
                        <h3>{g.title}</h3>
                        <p>{g.description}</p>
                        <div className="grievance-meta">
                          <span><strong>ID:</strong> {g.grievanceId}</span>
                          <span><strong>Priority:</strong>
                            <span className={getPriorityClass(g.priority)}>
                              {g.priority}
                            </span>
                          </span>
                          <span><strong>Status:</strong> {getStatusDisplay(g.status)}</span>
                          <span><strong>Created:</strong> {formatDate(g.createdAt)}</span>
                          {g.assignedTo && <span><strong>Assigned to:</strong> Staff ID: {g.assignedTo}</span>}
                          {g.categoryName && <span><strong>Category:</strong> {g.categoryName}</span>}
                          {g.departmentName && <span><strong>Department:</strong> {g.departmentName}</span>}
                        </div>
                        <div className="grievance-actions">
                          {g.status === "submitted" && (
                            <>
                              <button
                                className="btn-small btn-primary"
                                onClick={() => assignToMe(g.id)}
                              >
                                👤 Assign to Me
                              </button>
                              <button
                                className="btn-small btn-secondary"
                                onClick={() => {
                                  setSelectedGrievance(g);
                                  setActiveView("assign-grievance");
                                }}
                              >
                                📋 View Details
                              </button>
                            </>
                          )}
                          {g.status === "assigned_to_admin" && (
                            <button
                              className="btn-small btn-info"
                              onClick={() => {
                                setSelectedGrievance(g);
                                setActiveView("assign-grievance");
                              }}
                            >
                              👥 Assign to Staff
                            </button>
                          )}
                          {g.status === "resolved" && g.feedback && (
                            <span className="feedback-badge">
                              ⭐ {g.feedback.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {grievances.length === 0 && (
                      <div className="empty-state">
                        <p>No grievances found with current filters.</p>
                        <button
                          className="btn-primary"
                          onClick={handleResetFilters}
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </div>

                  <PaginationControls />
                </>
              )}
            </div>
          )}

          {/* ASSIGN GRIEVANCE VIEW */}
          {activeView === "assign-grievance" && selectedGrievance && (
            <div className="grievance-details-view">
              <div className="details-header">
                <button
                  className="back-btn"
                  onClick={() => setActiveView("dashboard")}
                >
                  ← Back to Dashboard
                </button>
                <h1>Assign Grievance to Staff</h1>
              </div>

              <div className="grievance-detail-card">
                <div className="detail-section">
                  <h2>{selectedGrievance.title}</h2>
                  <div className="detail-meta">
                    <span><strong>ID:</strong> {selectedGrievance.grievanceId}</span>
                    <span><strong>Priority:</strong>
                      <span className={getPriorityClass(selectedGrievance.priority)}>
                        {selectedGrievance.priority}
                      </span>
                    </span>
                    <span><strong>Status:</strong> {getStatusDisplay(selectedGrievance.status)}</span>
                    <span><strong>Created:</strong> {formatDate(selectedGrievance.createdAt)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{selectedGrievance.description}</p>
                </div>

                <div className="detail-section status-update-form">
                  <h3>Assign to Staff Member</h3>

                  <div className="form-group">
                    <label>Select Staff Member *</label>
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                      className="status-select"
                      disabled={loading}
                    >
                      <option value="">Choose a staff member...</option>
                      {staffMembers.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.firstName} {staff.lastName} - {staff.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignStaffId && (
                    <div className="staff-info">
                      <h4>Selected Staff:</h4>
                      <div className="staff-details">
                        {staffMembers.find(s => s.id.toString() === assignStaffId) && (
                          <>
                            <p><strong>Name:</strong> {staffMembers.find(s => s.id.toString() === assignStaffId).firstName} {staffMembers.find(s => s.id.toString() === assignStaffId).lastName}</p>
                            <p><strong>Email:</strong> {staffMembers.find(s => s.id.toString() === assignStaffId).email}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={() => assignToStaff(selectedGrievance.id, assignStaffId)}
                    disabled={!assignStaffId || loading}
                  >
                    {loading ? "Assigning..." : "✅ Assign to Staff"}
                  </button>

                  <button
                    className="btn-danger"
                    style={{ marginLeft: "10px" }}
                    onClick={() => {
                      const reason = prompt("Please provide a reason for rejection:");
                      if (reason) {
                        rejectGrievance(selectedGrievance.id, reason);
                      }
                    }}
                  >
                    ❌ Reject Grievance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAFF MANAGEMENT VIEW */}
          {activeView === "staff" && (
            <div>
              <h1>Staff Management</h1>
              <p>Manage staff members in your department.</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{staffMembers.length}</h3>
                  <p>Total Staff</p>
                </div>
              </div>

              <div className="staff-list">
                <h3>Staff Members</h3>
                {staffMembers.length === 0 ? (
                  <div className="empty-state">
                    <p>No staff members in your department.</p>
                  </div>
                ) : (
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffMembers.map(staff => (
                        <tr key={staff.id}>
                          <td>{staff.firstName} {staff.lastName}</td>
                          <td>{staff.email}</td>
                          <td>{staff.role}</td>
                          <td>
                            <span className={`status-${staff.isActive ? 'active' : 'inactive'}`}>
                              {staff.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Staff Performance */}
              {staffPerformance.length > 0 && (
                <div className="performance-section">
                  <h3>Staff Performance</h3>
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Staff Name</th>
                        <th>Assigned</th>
                        <th>Resolved</th>
                        <th>Pending</th>
                        <th>Resolution Rate</th>
                        <th>Avg. Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPerformance.map(performance => (
                        <tr key={performance.staffId}>
                          <td>{performance.staffName}</td>
                          <td>{performance.assignedGrievances}</td>
                          <td>{performance.resolvedGrievances}</td>
                          <td>{performance.pendingGrievances}</td>
                          <td>{performance.resolutionRate?.toFixed(1)}%</td>
                          <td>{performance.avgResolutionTime || 0}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {activeView === "analytics" && (
            <div>
              <h1>Analytics & Reports</h1>
              <p>Department performance analytics.</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{stats.totalGrievances}</h3>
                  <p>Total Grievances</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.newGrievances}</h3>
                  <p>Pending</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.resolved}</h3>
                  <p>Resolved</p>
                </div>
                <div className="stat-card">
                  <h3>
                    {stats.totalGrievances > 0 
                      ? Math.round((stats.resolved / stats.totalGrievances) * 100) 
                      : 0}%
                  </h3>
                  <p>Resolution Rate</p>
                </div>
              </div>

              <div className="analytics-chart">
                <h3>Grievance Distribution</h3>
                <div className="chart-bars">
                  <div className="chart-bar" style={{height: '100px', width: '80px', margin: '0 10px'}}>
                    <div 
                      className="bar-fill" 
                      style={{
                        height: `${(stats.newGrievances / Math.max(stats.totalGrievances, 1)) * 100}%`,
                        backgroundColor: '#3498db'
                      }}
                    ></div>
                    <div className="bar-label">New</div>
                  </div>
                  <div className="chart-bar" style={{height: '100px', width: '80px', margin: '0 10px'}}>
                    <div
                      className="bar-fill" 
                      style={{
                        height: `${((stats.inProgress + stats.assignedToAdmin + stats.assignedToStaff) / Math.max(stats.totalGrievances, 1)) * 100}%`,
                        backgroundColor: '#f39c12'
                      }}
                    ></div>
                    <div className="bar-label">In Progress</div>
                  </div>
                  <div className="chart-bar" style={{height: '100px', width: '80px', margin: '0 10px'}}>
                    <div 
                      className="bar-fill" 
                      style={{
                        height: `${(stats.resolved / Math.max(stats.totalGrievances, 1)) * 100}%`,
                        backgroundColor: '#27ae60'
                      }}
                    ></div>
                    <div className="bar-label">Resolved</div>
                  </div>
                  <div className="chart-bar" style={{height: '100px', width: '80px', margin: '0 10px'}}>
                    <div 
                      className="bar-fill" 
                      style={{
                        height: `${(stats.rejected / Math.max(stats.totalGrievances, 1)) * 100}%`,
                        backgroundColor: '#e74c3c'
                      }}
                    ></div>
                    <div className="bar-label">Rejected</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;