import React from 'react';
import './Sidebar.css';

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
  onResetFilters,
  categories = []
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'my-grievances', label: 'My Grievances', icon: '📋' },
    { id: 'track-grievance', label: 'Track Grievance', icon: '🔍' },
    { id: 'new-grievance', label: 'Submit Grievance', icon: '📝' },
    { id: 'quick-stats', label: 'Quick Stats', icon: '📊' },
    { type: 'divider' },
    { id: 'privacy-security', label: 'Privacy & Security', icon: '🛡️' },
    { id: 'help-support', label: 'Help & Support', icon: '❓' },
  ];

  const handleMenuClick = (itemId) => {
    setActiveView(itemId);
    setShowFilters(false);
    if (onClose) {
      onClose();
    }
  };

  const handleFilterClick = () => {
    setShowFilters(!showFilters); // Default to grievances view when filtering
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
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h3>{user.first_name} {user.last_name}</h3>
              <p>Student • {user.department || 'Computer Science'}</p>
            </div>
          </div>
          <button className="close-sidebar" onClick={onClose}>×</button>
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
              <label>Sort By</label>
              <select
                value={filters?.sortBy || 'createdAt'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="filter-select"
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
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
            <span>Smart Grievance Management</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;