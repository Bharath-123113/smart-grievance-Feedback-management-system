import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";
import { staffDashboardApi } from "../services/apiService";

// Sidebar Component - UPDATED WITH UNIQUE CLASS NAME
const Sidebar = ({ 
  isOpen, 
  onClose, 
  user, 
  activeView, 
  setActiveView,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  onApplyFilters,
  onResetFilters
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'My Tasks', icon: '📝' },
    { id: 'grievances', label: 'Grievance Queue', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { type: 'divider' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  const handleMenuClick = (itemId) => {
    setActiveView(itemId);
    setShowFilters(false);
    if (onClose) {
      onClose();
    }
  };

  const handleFilterClick = () => {
    setShowFilters(!showFilters);
  };

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleResetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <>
      {/* Overlay - only visible on mobile when sidebar is open */}
      {isOpen && <div className="sidebar-overlay visible" onClick={onClose}></div>}

      {/* UPDATED: Added 'dept-sidebar' class */}
      <div className={`dept-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">👨‍💼</div>
            <div className="user-details">
              <h3>{user.first_name} {user.last_name}</h3>
              <p>Staff Member</p>
            </div>
          </div>
          <button className="close-sidebar" onClick={onClose} aria-label="Close menu">×</button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`divider-${index}`} className="nav-divider"></div>;
            }

            return (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}

          {/* Filters Menu Item */}
          <div className="nav-divider"></div>
          <button
            className={`nav-item ${showFilters ? 'active' : ''}`}
            onClick={handleFilterClick}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-label">Filters</span>
          </button>
        </nav>

        {/* Filter Panel */}
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

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters?.sortBy || 'updatedAt'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="filter-select"
              >
                <option value="updatedAt">Updated Date</option>
                <option value="createdAt">Created Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort Order</label>
              <select
                value={filters?.sortDirection || 'desc'}
                onChange={(e) => setFilters({ ...filters, sortDirection: e.target.value })}
                className="filter-select"
              >
                <option value="desc">Descending (Newest First)</option>
                <option value="asc">Ascending (Oldest First)</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-range-inputs">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={filters?.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="date-input"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={filters?.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="date-input"
                />
              </div>
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

        <div className="sidebar-footer">
          <div className="app-info">
            <p>ResolveIT v2.1.0</p>
            <span>Staff Dashboard</span>
          </div>
        </div>
      </div>
    </>
  );
};

// Search Bar Component
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

// Main Dashboard Component
const DepartmentDashboard = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [staffComment, setStaffComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    inProgress: 0,
    resolved: 0,
    pendingReview: 0
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    sortBy: 'updatedAt',
    sortDirection: 'desc'
  });

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Prevent body scrolling on mobile when sidebar is open
    if (!sidebarOpen && window.innerWidth <= 768) {
      document.body.classList.add('sidebar-open-mobile');
    } else {
      document.body.classList.remove('sidebar-open-mobile');
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.classList.remove('sidebar-open-mobile');
  };

  // Close sidebar on window resize if on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        // On desktop, we don't need the mobile scroll lock
        document.body.classList.remove('sidebar-open-mobile');
      } else if (sidebarOpen) {
        // On mobile, add scroll lock if sidebar is open
        document.body.classList.add('sidebar-open-mobile');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Fetch grievances
  const fetchGrievances = async (page = 0, customFilters = null, customSearch = null) => {
    try {
      setLoading(true);
      
      const currentFilters = customFilters || filters;
      const currentSearch = customSearch !== undefined ? customSearch : searchKeyword;
      
      let response;
      
      if (currentSearch) {
        response = await staffDashboardApi.searchGrievances(
          currentSearch,
          page,
          pagination.size
        );
      } else if (currentFilters.status || currentFilters.priority || currentFilters.startDate || currentFilters.endDate) {
        const filterParams = {
          ...currentFilters,
          page: page,
          size: pagination.size
        };
        response = await staffDashboardApi.filterGrievances(filterParams);
      } else {
        response = await staffDashboardApi.getPaginatedGrievances(
          page,
          pagination.size,
          currentFilters.sortBy,
          currentFilters.sortDirection
        );
      }
      
      let grievancesData = [];
      let totalElements = 0;
      let totalPages = 0;
      
      if (response.data && response.data.content) {
        grievancesData = response.data.content;
        totalElements = response.data.totalElements || 0;
        totalPages = response.data.totalPages || 0;
      } else if (response.content) {
        grievancesData = response.content;
        totalElements = response.totalElements || 0;
        totalPages = response.totalPages || 0;
      } else {
        grievancesData = response.data || response;
      }
      
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

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await staffDashboardApi.getStaffStats();
      if (response.success) {
        setStats(response.data || {
          totalAssigned: 0,
          inProgress: 0,
          resolved: 0,
          pendingReview: 0
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (activeView === "dashboard" || activeView === "grievances" || activeView === "tasks") {
      fetchGrievances(pagination.page);
      if (activeView === "dashboard") {
        fetchStats();
      }
    }
  }, [activeView]);

  // Handle filter application
  const handleApplyFilters = () => {
    setSearchKeyword('');
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchGrievances(0, filters, '');
    setShowFilters(false);
    closeSidebar();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    const resetFilters = {
      status: '',
      priority: '',
      startDate: '',
      endDate: '',
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    };
    setFilters(resetFilters);
    setSearchKeyword('');
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchGrievances(0, resetFilters, '');
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    const resetFilters = {
      status: '',
      priority: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortDirection: 'desc'
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

  // Update grievance status
  const updateGrievanceStatus = async (grievanceId, newStatus, comment = "") => {
    try {
      setLoading(true);
      const response = await staffDashboardApi.updateGrievanceStatus(grievanceId, {
        status: newStatus,
        note: comment
      });
      
      if (response.success) {
        setGrievances(prev => prev.map(g => 
          g.id === grievanceId ? response.data : g
        ));
        
        fetchStats();
        
        setStatusUpdate("");
        setStaffComment("");
        alert(`✅ Grievance status updated to ${newStatus}`);
        
        if (activeView === "grievance-details") {
          setActiveView("dashboard");
        }
        
        fetchGrievances(pagination.page);
      } else {
        alert(`Failed to update status: ${response.message}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    if (!statusUpdate) {
      alert("Please select a status");
      return;
    }

    if (!selectedGrievance) {
      alert("No grievance selected");
      return;
    }

    updateGrievanceStatus(selectedGrievance.id, statusUpdate, staffComment);
  };

  // Stats calculation
  const newCount = grievances.filter((g) => g.status === "submitted" || g.status === "assigned_to_staff").length;
  const inProgress = grievances.filter((g) => g.status === "in_progress").length;
  const resolved = grievances.filter((g) => g.status === "resolved").length;
  const total = grievances.length;

  // Handle view changes
  const handleViewChange = (view) => {
    setActiveView(view);
    setShowFilters(false);
    closeSidebar();
  };

  // Handle grievance selection
  const handleGrievanceSelect = (grievance) => {
    setSelectedGrievance(grievance);
    setActiveView("grievance-details");
  };

  // Quick status update functions
  const markInProgress = (grievanceId) => {
    updateGrievanceStatus(grievanceId, "in_progress", "Grievance taken up for resolution");
  };

  const markResolved = (grievanceId) => {
    updateGrievanceStatus(grievanceId, "resolved", "Grievance successfully resolved");
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

  // Pagination Controls Component
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

  // Get recent grievances for dashboard (newest 3)
  const recentGrievances = [...grievances]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 3);

  // Header Component
  const Header = () => {
    return (
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className={`hamburger-btn ${sidebarOpen ? "open" : ""}`}
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
              DEPARTMENT STAFF DASHBOARD
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
    );
  };

  // Render Active View
  const renderActiveView = () => {
    if (loading && activeView === 'dashboard') {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'tasks':
        return (
          <div className="view-container">
            <h2 className="view-title">📝 My Tasks</h2>
            <p className="view-subtitle">Grievances currently in progress that need your attention.</p>
            
            <SearchBar
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSearch={handleSearch}
              loading={loading}
            />
            
            {loading ? (
              <div className="loading">Loading tasks...</div>
            ) : (
              <div className="grievance-list">
                {grievances
                  .filter((g) => g.status === "in_progress")
                  .map((g) => (
                    <div className="grievance-item" key={g.id}>
                      <h3>{g.title}</h3>
                      <p>{g.description}</p>
                      <div className="grievance-meta">
                        <span><strong>ID:</strong> {g.grievanceId}</span>
                        <span><strong>Priority:</strong> {g.priority}</span>
                        <span><strong>Status:</strong> {getStatusDisplay(g.status)}</span>
                        <span><strong>Created:</strong> {formatDate(g.createdAt)}</span>
                        <span><strong>Updated:</strong> {formatDate(g.updatedAt)}</span>
                      </div>
                      <div className="grievance-actions">
                        <button
                          className="btn-small btn-success"
                          onClick={() => markResolved(g.id)}
                        >
                          ✅ Mark Resolved
                        </button>
                        <button
                          className="btn-small btn-primary"
                          onClick={() => handleGrievanceSelect(g)}
                        >
                          📋 View Details
                        </button>
                      </div>
                    </div>
                  ))}

                {grievances.filter(g => g.status === "in_progress").length === 0 && (
                  <div className="empty-state">
                    <p>No tasks currently in progress. 🎉</p>
                    <p>Check the grievance queue for new assignments.</p>
                  </div>
                )}
              </div>
            )}
            
            <PaginationControls />
          </div>
        );

      case 'grievances':
        return (
          <div className="view-container">
            <h2 className="view-title">📋 Grievance Queue</h2>
            <p className="view-subtitle">All grievances assigned to you. Use filters or search to narrow down results.</p>
            
            <SearchBar
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
                        <span><strong>Priority:</strong> {g.priority}</span>
                        <span><strong>Status:</strong> {getStatusDisplay(g.status)}</span>
                        <span><strong>Created:</strong> {formatDate(g.createdAt)}</span>
                        <span><strong>Updated:</strong> {formatDate(g.updatedAt)}</span>
                      </div>

                      <div className="grievance-actions">
                        {(g.status === "assigned_to_staff" || g.status === "submitted") && (
                          <button
                            className="btn-small btn-info"
                            onClick={() => markInProgress(g.id)}
                          >
                            🔄 Take Action
                          </button>
                        )}

                        {g.status === "in_progress" && (
                          <button
                            className="btn-small btn-success"
                            onClick={() => markResolved(g.id)}
                          >
                            ✅ Mark Resolved
                          </button>
                        )}

                        <button
                          className="btn-small btn-secondary"
                          onClick={() => handleGrievanceSelect(g)}
                        >
                          📋 View Details
                        </button>
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
        );

      case 'grievance-details':
        return (
          <div className="view-container">
            <div className="details-header">
              <button
                className="back-btn"
                onClick={() => setActiveView("dashboard")}
              >
                ← Back to Dashboard
              </button>
              <h2 className="view-title">Grievance Details</h2>
            </div>

            {selectedGrievance && (
              <div className="grievance-detail-card">
                <div className="detail-section">
                  <h3>{selectedGrievance.title}</h3>
                  <div className="detail-meta">
                    <span><strong>ID:</strong> {selectedGrievance.grievanceId}</span>
                    <span><strong>Priority:</strong> {selectedGrievance.priority}</span>
                    <span><strong>Status:</strong> {getStatusDisplay(selectedGrievance.status)}</span>
                    <span><strong>Created:</strong> {formatDate(selectedGrievance.createdAt)}</span>
                    {selectedGrievance.updatedAt && (
                      <span><strong>Updated:</strong> {formatDate(selectedGrievance.updatedAt)}</span>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedGrievance.description}</p>
                </div>

                {selectedGrievance.resolutionNotes && (
                  <div className="detail-section">
                    <h4>Resolution Notes</h4>
                    <p>{selectedGrievance.resolutionNotes}</p>
                  </div>
                )}

                {/* Status Update Form */}
                {selectedGrievance.status !== "resolved" && selectedGrievance.status !== "rejected" && (
                  <div className="detail-section status-update-form">
                    <h4>Update Status</h4>
                    <div className="form-group">
                      <label>New Status *</label>
                      <select
                        value={statusUpdate}
                        onChange={(e) => setStatusUpdate(e.target.value)}
                        className="status-select"
                      >
                        <option value="">Select Status</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Comments (Optional)</label>
                      <textarea
                        value={staffComment}
                        onChange={(e) => setStaffComment(e.target.value)}
                        placeholder="Add any comments or notes about this status update..."
                        rows="3"
                        className="comment-textarea"
                      />
                    </div>

                    <button
                      className="btn-primary"
                      onClick={handleStatusUpdate}
                      disabled={!statusUpdate || loading}
                    >
                      {loading ? "Updating..." : "Update Status"}
                    </button>

                    {/* Quick Action Buttons */}
                    <div className="quick-actions-horizontal">
                      {selectedGrievance.status === "assigned_to_staff" && (
                        <button
                          className="btn-info"
                          onClick={() => {
                            setStatusUpdate("in_progress");
                            setStaffComment("Grievance taken up for resolution");
                          }}
                        >
                          🔄 Mark as In Progress
                        </button>
                      )}
                      {selectedGrievance.status === "in_progress" && (
                        <button
                          className="btn-success"
                          onClick={() => {
                            setStatusUpdate("resolved");
                            setStaffComment("Grievance successfully resolved");
                          }}
                        >
                          ✅ Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="view-container">
            <h2 className="view-title">📈 Analytics & Reports</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{total}</h3>
                <p>Total Assigned</p>
              </div>
              <div className="stat-card">
                <h3>{inProgress}</h3>
                <p>In Progress</p>
              </div>
              <div className="stat-card">
                <h3>{resolved}</h3>
                <p>Resolved</p>
              </div>
              <div className="stat-card">
                <h3>{total > 0 ? Math.round((resolved / total) * 100) : 0}%</h3>
                <p>Resolution Rate</p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="view-container">
            <h2 className="view-title">🔔 Notifications</h2>
            <p>Notifications will appear here.</p>
          </div>
        );

      case 'profile':
        return (
          <div className="view-container">
            <h2 className="view-title">👤 My Profile</h2>
            <div className="profile-card">
              <h3>{user.first_name} {user.last_name}</h3>
              <p><strong>Role:</strong> Staff Member</p>
              <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div className="dashboard-main">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-content">
                <h1>Hello, {user?.first_name || 'Staff'}! 👨‍💼</h1>
                <p>Manage your assigned grievances efficiently and help resolve student concerns.</p>
              </div>
              <div className="welcome-actions">
                <button
                  className="action-btn primary"
                  onClick={() => handleViewChange('tasks')}
                >
                  📝 View My Tasks
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => handleViewChange('grievances')}
                >
                  📋 View Grievance Queue
                </button>
                <button
                  className="action-btn tertiary"
                  onClick={() => handleViewChange('analytics')}
                >
                  📈 View Analytics
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{stats.totalAssigned || total}</h3>
                <p>Total Assigned</p>
              </div>

              <div className="stat-card">
                <h3>{stats.pendingReview || newCount}</h3>
                <p>Pending Review</p>
              </div>

              <div className="stat-card">
                <h3>{stats.inProgress || inProgress}</h3>
                <p>In Progress</p>
              </div>

              <div className="stat-card">
                <h3>{stats.resolved || resolved}</h3>
                <p>Resolved</p>
              </div>
            </div>

            {/* Recent Grievances */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>📋 Recent Grievances</h3>
                <button
                  className="view-all-btn"
                  onClick={() => handleViewChange('grievances')}
                >
                  View All →
                </button>
              </div>
              {recentGrievances.length === 0 ? (
                <div className="empty-state">
                  <p>No grievances assigned to you yet.</p>
                </div>
              ) : (
                <div className="grievance-list">
                  {recentGrievances.map((g) => (
                    <div 
                      className="grievance-item" 
                      key={g.id} 
                      onClick={() => handleGrievanceSelect(g)}
                      style={{cursor: 'pointer'}}
                    >
                      <h4>{g.title}</h4>
                      <p>{g.description}</p>
                      <div className="grievance-meta">
                        <span><strong>ID:</strong> {g.grievanceId}</span>
                        <span><strong>Priority:</strong> {g.priority}</span>
                        <span><strong>Status:</strong> {getStatusDisplay(g.status)}</span>
                        <span><strong>Created:</strong> {formatDate(g.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dept-dashboard">
      <Header />

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
      />

      <main className="dashboard-content">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default DepartmentDashboard;