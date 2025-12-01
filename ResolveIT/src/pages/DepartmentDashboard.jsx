import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

const DepartmentDashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [staffComment, setStaffComment] = useState("");
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Sample grievances data - NEWEST FIRST with consistent grievance IDs
  const [grievances, setGrievances] = useState([
    {
      id: 6,
      title: "PDF Submission Issue",
      department: "Academic",
      student: "Rahul Verma",
      status: "new",
      priority: "medium",
      description: "Unable to upload PDF files to the assignment portal. Getting 'file format not supported' error.",
      submitted: "30 minutes ago",
      grievanceId: "CRY-X2024-006",
      studentComments: "This is affecting my assignment submissions. Need urgent help.",
      statusTimeline: [
        { status: "submitted", date: "2024-01-25 10:30", note: "Grievance submitted by student", updatedBy: "System" }
      ]
    },
    {
      id: 5,
      title: "Library Books Not Available",
      department: "Library",
      student: "Anita Desai",
      status: "new",
      priority: "high",
      description: "Required textbooks for CS-301 are always issued to other students. Need urgent access for semester preparation.",
      submitted: "2 hours ago",
      grievanceId: "CRY-X2024-005",
      studentComments: "Exam is in 2 weeks, need books urgently.",
      statusTimeline: [
        { status: "submitted", date: "2024-01-25 09:15", note: "Grievance submitted by student", updatedBy: "System" }
      ]
    },
    {
      id: 4,
      title: "Project Grade Dispute",
      department: "Academic",
      student: "Priya Sharma",
      status: "in-progress",
      priority: "high",
      description: "I believe my project deserves higher marks based on the rubric criteria. The evaluation seems inconsistent with the provided grading guidelines.",
      submitted: "5 hours ago",
      grievanceId: "CRY-X2024-004",
      assignedTo: "Prof. Priya",
      studentComments: "I have attached the rubric and my project for reference.",
      statusTimeline: [
        { status: "submitted", date: "2024-01-25 06:45", note: "Grievance submitted by student", updatedBy: "System" },
        { status: "in-progress", date: "2024-01-25 08:20", note: "Assigned to Prof. Priya for review", updatedBy: "Admin" }
      ]
    },
    {
      id: 3,
      title: "Lab Equipment Maintenance",
      department: "Infrastructure",
      student: "Rajesh Kumar",
      status: "in-progress",
      priority: "medium",
      description: "Microscope in Biology Lab 2 needs calibration. Results are inconsistent during experiments.",
      submitted: "1 day ago",
      grievanceId: "CRY-X2024-003",
      assignedTo: "Prof. Priya",
      studentComments: "This is affecting our practical exams preparation.",
      statusTimeline: [
        { status: "submitted", date: "2024-01-24 14:20", note: "Grievance submitted by student", updatedBy: "System" },
        { status: "in-progress", date: "2024-01-24 15:30", note: "Technician assigned for inspection", updatedBy: "Prof. Priya" }
      ]
    },
    {
      id: 2,
      title: "Hostel Room Issue",
      department: "Administrative",
      student: "Meera Singh",
      status: "resolved",
      priority: "low",
      description: "Leaking faucet in room 304, needs immediate plumbing attention.",
      submitted: "2 days ago",
      grievanceId: "CRY-X2024-002",
      assignedTo: "Dr. Sharma",
      resolvedBy: "Dr. Sharma",
      studentComments: "Water is leaking continuously, causing inconvenience.",
      resolutionNotes: "Plumber visited and fixed the faucet. Issue resolved.",
      statusTimeline: [
        { status: "submitted", date: "2024-01-23 11:15", note: "Grievance submitted by student", updatedBy: "System" },
        { status: "in-progress", date: "2024-01-23 14:30", note: "Plumbing team notified", updatedBy: "Dr. Sharma" },
        { status: "resolved", date: "2024-01-24 10:45", note: "Faucet repaired successfully", updatedBy: "Dr. Sharma" }
      ]
    },
    {
      id: 1,
      title: "WiFi Connectivity Issues",
      department: "Infrastructure",
      student: "Ajay Kumar",
      status: "resolved",
      priority: "medium",
      description: "WiFi connection is down in the entire 3rd floor of the main building. Students are unable to access online resources for classes.",
      submitted: "3 days ago",
      grievanceId: "CRY-X2024-001",
      resolvedBy: "Prof. Priya",
      studentComments: "Unable to attend online classes or submit assignments.",
      resolutionNotes: "Router configuration updated. WiFi restored on 3rd floor.",
      statusTimeline: [
        { status: "submitted", date: "2024-01-22 09:30", note: "Grievance submitted by student", updatedBy: "System" },
        { status: "in-progress", date: "2024-01-22 11:15", note: "IT team investigating connectivity issues", updatedBy: "Prof. Priya" },
        { status: "resolved", date: "2024-01-23 16:20", note: "Network issue resolved", updatedBy: "Prof. Priya" }
      ]
    }
  ]);

  // Sort grievances by ID (newest first)
  const sortedGrievances = [...grievances].sort((a, b) => b.id - a.id);

  // Get recent grievances for dashboard (newest 3)
  const recentGrievances = sortedGrievances.slice(0, 3);

  // Pagination
  const totalPages = Math.ceil(sortedGrievances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentGrievances = sortedGrievances.slice(startIndex, startIndex + itemsPerPage);

  // Actions - Only admin can assign
  const assignToMe = (id) => {
    if (user.role === "admin") {
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                assignedTo: `${user.first_name} ${user.last_name}`,
                status: "in-progress",
                statusTimeline: [
                  ...g.statusTimeline,
                  {
                    status: "in-progress",
                    date: new Date().toLocaleString(),
                    note: `Assigned to ${user.first_name} ${user.last_name}`,
                    updatedBy: `${user.first_name} ${user.last_name}`
                  }
                ]
              }
            : g
        )
      );
    }
  };

  const updateGrievanceStatus = (grievanceId, newStatus, comment = "") => {
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === grievanceId ? {
          ...g,
          status: newStatus,
          ...(newStatus === "resolved" && {
            resolvedBy: `${user.first_name} ${user.last_name}`,
            resolutionNotes: comment
          }),
          statusTimeline: [
            ...g.statusTimeline,
            {
              status: newStatus,
              date: new Date().toLocaleString(),
              note: comment || `Status updated to ${newStatus}`,
              updatedBy: `${user.first_name} ${user.last_name}`
            }
          ]
        } : g
      )
    );

    // Reset form and show success message
    setStatusUpdate("");
    setStaffComment("");
    alert(`✅ Grievance status updated to ${newStatus}`);
  };

  const handleStatusUpdate = () => {
    if (!statusUpdate) {
      alert("Please select a status");
      return;
    }

    updateGrievanceStatus(selectedGrievance.id, statusUpdate, staffComment);
    setActiveView("dashboard"); // Return to dashboard after update
  };

  // Stats calculation
  const total = sortedGrievances.length;
  const newCount = sortedGrievances.filter((g) => g.status === "new").length;
  const inProgress = sortedGrievances.filter((g) => g.status === "in-progress").length;
  const resolved = sortedGrievances.filter((g) => g.status === "resolved").length;

  // Pagination controls
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Handle view changes for all menu items
  const handleViewChange = (view) => {
    setActiveView(view);
    closeSidebar();
  };

  // Handle grievance selection
  const handleGrievanceSelect = (grievance) => {
    setSelectedGrievance(grievance);
    setActiveView("grievance-details");
  };

  // Quick status update functions
  const markInProgress = (grievanceId) => {
    updateGrievanceStatus(grievanceId, "in-progress", "Grievance taken up for resolution");
  };

  const markResolved = (grievanceId) => {
    updateGrievanceStatus(grievanceId, "resolved", "Grievance successfully resolved");
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
              {user.role === "admin" ? "DEPARTMENT ADMIN" : "DEPARTMENT STAFF"}
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
              className={`menu-item ${activeView === "tasks" ? "active" : ""}`}
              onClick={() => handleViewChange("tasks")}
            >
              📝 My Tasks <span className="badge">{inProgress}</span>
            </div>

            <div
              className={`menu-item ${activeView === "grievances" ? "active" : ""}`}
              onClick={() => {
                handleViewChange("grievances");
                setCurrentPage(1);
              }}
            >
              📋 Grievance Queue <span className="badge">{newCount}</span>
            </div>

            <div
              className={`menu-item ${activeView === "analytics" ? "active" : ""}`}
              onClick={() => handleViewChange("analytics")}
            >
              📈 Analytics
            </div>

            {/* Admin-only section */}
            {user.role === "admin" && (
              <>
                <h4>Admin Controls</h4>
                <div className="menu-item">👥 Manage Staff</div>
                <div className="menu-item">⚙️ Settings</div>
                <div className="menu-item">📑 Reports</div>
              </>
            )}

            {/* Support Items */}
            <div
              className={`menu-item ${activeView === "help-support" ? "active" : ""}`}
              onClick={() => handleViewChange("help-support")}
            >
              ❓ Help & Support
            </div>

            <div
              className={`menu-item ${activeView === "notifications" ? "active" : ""}`}
              onClick={() => handleViewChange("notifications")}
            >
              🔔 Notifications <span className="badge">3</span>
            </div>

            <div
              className={`menu-item ${activeView === "profile" ? "active" : ""}`}
              onClick={() => handleViewChange("profile")}
            >
              👤 My Profile
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {/* DASHBOARD VIEW */}
          {activeView === "dashboard" && (
            <>
              <div className="welcome-section">
                <h1>Hello, {user.first_name}!</h1>
                <p>Manage department grievances efficiently and effectively.</p>
              </div>

              <div className="quick-actions">
                <button
                  className="action-btn"
                  onClick={() => handleViewChange("grievances")}
                >
                  📋 View New Grievances
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleViewChange("tasks")}
                >
                  📝 My Tasks
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleViewChange("analytics")}
                >
                  📈 Analytics
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{total}</h3>
                  <p>Total Grievances</p>
                </div>

                <div className="stat-card">
                  <h3>{newCount}</h3>
                  <p>New Grievances</p>
                </div>

                <div className="stat-card">
                  <h3>{inProgress}</h3>
                  <p>In Progress</p>
                </div>

                <div className="stat-card">
                  <h3>{resolved}</h3>
                  <p>Resolved</p>
                </div>
              </div>

              {/* Recent Grievances Section */}
              <div className="recent-grievances">
                <h2>Recent Grievances</h2>
                <div className="grievance-list">
                  {recentGrievances.map((g) => (
                    <div className="grievance-item" key={g.id} onClick={() => handleGrievanceSelect(g)} style={{cursor: 'pointer'}}>
                      <h3>{g.title}</h3>
                      <p>{g.description}</p>
                      <div className="grievance-meta">
                        <span><strong>Grievance ID:</strong> {g.grievanceId}</span>
                        <span>From: {g.student}</span>
                        <span>Department: {g.department}</span>
                        <span className={`priority-${g.priority}`}>
                          Priority: {g.priority}
                        </span>
                        <span>Status:
                          <strong>
                            {g.status === 'new' && ' 🆕 New'}
                            {g.status === 'in-progress' && ' 🔄 In Progress'}
                            {g.status === 'resolved' && ' ✅ Resolved'}
                          </strong>
                        </span>
                        <span>Submitted: {g.submitted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TASKS VIEW */}
          {activeView === "tasks" && (
            <div>
              <h1>My Tasks</h1>
              <p>Grievances assigned to you that need attention.</p>

              <div className="grievance-list">
                {sortedGrievances
                  .filter((g) => g.status === "in-progress" && g.assignedTo === `${user.first_name} ${user.last_name}`)
                  .map((g) => (
                    <div className="grievance-item" key={g.id}>
                      <h3>{g.title}</h3>
                      <p>{g.description}</p>
                      <div className="grievance-meta">
                        <span><strong>Grievance ID:</strong> {g.grievanceId}</span>
                        <span>From: {g.student}</span>
                        <span>Department: {g.department}</span>
                        <span className={`priority-${g.priority}`}>
                          Priority: {g.priority}
                        </span>
                        <span>Submitted: {g.submitted}</span>
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

                {inProgress === 0 && (
                  <div className="empty-state">
                    <p>No tasks assigned to you. 🎉</p>
                    <p>All caught up! Check the grievance queue for new items.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRIEVANCE QUEUE VIEW */}
          {activeView === "grievances" && (
            <div>
              <h1>Grievance Queue</h1>
              <p>New grievances that need to be addressed.</p>

              <div className="grievance-list">
                {currentGrievances.map((g) => (
                  <div className="grievance-item" key={g.id}>
                    <h3>{g.title}</h3>
                    <p>{g.description}</p>
                    <div className="grievance-meta">
                      <span><strong>Grievance ID:</strong> {g.grievanceId}</span>
                      <span>From: {g.student}</span>
                      <span>Department: {g.department}</span>
                      <span className={`priority-${g.priority}`}>
                        Priority: {g.priority}
                      </span>
                      <span>Submitted: {g.submitted}</span>
                      <span>Status:
                        <strong>
                          {g.status === 'new' && ' 🆕 New'}
                          {g.status === 'in-progress' && ' 🔄 In Progress'}
                          {g.status === 'resolved' && ' ✅ Resolved'}
                        </strong>
                      </span>
                      {g.assignedTo && <span>Assigned to: {g.assignedTo}</span>}
                    </div>

                    <div className="grievance-actions">
                      {/* Only show Assign to Me for admin users */}
                      {g.status === "new" && user.role === "admin" && (
                        <button
                          className="btn-small btn-primary"
                          onClick={() => assignToMe(g.id)}
                        >
                          👤 Assign to Me
                        </button>
                      )}

                      {g.status === "in-progress" && g.assignedTo === `${user.first_name} ${user.last_name}` && (
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

                      {g.status === "new" && user.role !== "admin" && (
                        <button
                          className="btn-small btn-info"
                          onClick={() => markInProgress(g.id)}
                        >
                          🔄 Take Action
                        </button>
                      )}
                    </div>

                    {g.status === "resolved" && (
                      <span style={{color: '#2ecc71', fontWeight: 'bold'}}>
                        ✅ Resolved by {g.resolvedBy}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn-small"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn-small ${currentPage === page ? 'btn-primary' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="btn-small"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GRIEVANCE DETAILS VIEW */}
          {activeView === "grievance-details" && selectedGrievance && (
            <div className="grievance-details-view">
              <div className="details-header">
                <button
                  className="back-btn"
                  onClick={() => setActiveView("dashboard")}
                >
                  ← Back to Dashboard
                </button>
                <h1>Grievance Details</h1>
              </div>

              <div className="grievance-detail-card">
                <div className="detail-section">
                  <h2>{selectedGrievance.title}</h2>
                  <div className="detail-meta">
                    <span><strong>Grievance ID:</strong> {selectedGrievance.grievanceId}</span>
                    <span><strong>Student:</strong> {selectedGrievance.student}</span>
                    <span><strong>Department:</strong> {selectedGrievance.department}</span>
                    <span><strong>Priority:</strong>
                      <span className={`priority-${selectedGrievance.priority}`}>
                        {selectedGrievance.priority}
                      </span>
                    </span>
                    <span><strong>Status:</strong>
                      <span className={`status-${selectedGrievance.status}`}>
                        {selectedGrievance.status}
                      </span>
                    </span>
                    <span><strong>Submitted:</strong> {selectedGrievance.submitted}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{selectedGrievance.description}</p>
                </div>

                {selectedGrievance.studentComments && (
                  <div className="detail-section">
                    <h3>Student Comments</h3>
                    <p>{selectedGrievance.studentComments}</p>
                  </div>
                )}

                {selectedGrievance.resolutionNotes && (
                  <div className="detail-section">
                    <h3>Resolution Notes</h3>
                    <p>{selectedGrievance.resolutionNotes}</p>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="detail-section">
                  <h3>Status Timeline</h3>
                  <div className="timeline">
                    {selectedGrievance.statusTimeline.map((entry, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <strong>{entry.status.toUpperCase()}</strong>
                          <p>{entry.note}</p>
                          <small>By: {entry.updatedBy} • {entry.date}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Update Form */}
                {selectedGrievance.status !== "resolved" && (
                  <div className="detail-section status-update-form">
                    <h3>Update Status</h3>
                    <div className="form-group">
                      <label>New Status *</label>
                      <select
                        value={statusUpdate}
                        onChange={(e) => setStatusUpdate(e.target.value)}
                        className="status-select"
                      >
                        <option value="">Select Status</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        {user.role === "admin" && <option value="rejected">Rejected</option>}
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
                      disabled={!statusUpdate}
                    >
                      Update Status
                    </button>

                    {/* Quick Action Buttons */}
                    <div className="quick-actions-horizontal">
                      {selectedGrievance.status === "new" && (
                        <button
                          className="btn-info"
                          onClick={() => {
                            setStatusUpdate("in-progress");
                            setStaffComment("Grievance taken up for resolution");
                          }}
                        >
                          🔄 Mark as In Progress
                        </button>
                      )}
                      {selectedGrievance.status === "in-progress" && (
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
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {activeView === "analytics" && (
            <div>
              <h1>Analytics & Reports</h1>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{total}</h3>
                  <p>Total Grievances</p>
                </div>
                <div className="stat-card">
                  <h3>{newCount}</h3>
                  <p>Pending</p>
                </div>
                <div className="stat-card">
                  <h3>{inProgress}</h3>
                  <p>In Progress</p>
                </div>
                <div className="stat-card">
                  <h3>{resolved}</h3>
                  <p>Resolved</p>
                </div>
              </div>

              <div className="grievance-item" style={{marginTop: '20px'}}>
                <h3>Resolution Rate</h3>
                <p>{(resolved/total * 100).toFixed(1)}% of grievances resolved</p>
                <div style={{
                  background: '#f0f0f0',
                  borderRadius: '10px',
                  height: '20px',
                  marginTop: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#4a90e2',
                    height: '100%',
                    width: `${(resolved/total * 100)}%`,
                    transition: 'width 0.5s'
                  }}></div>
                </div>
              </div>
            </div>
          )}

          {/* HELP & SUPPORT VIEW */}
          {activeView === "help-support" && (
            <div className="view-container">
              <h1>Help & Support</h1>
              <div className="help-content">
                <div className="help-section">
                  <h3>📞 Contact Support</h3>
                  <p>If you need assistance with the grievance management system, please contact:</p>
                  <ul>
                    <li><strong>Email:</strong> support@resolveit.edu</li>
                    <li><strong>Phone:</strong> +1 (555) 123-HELP</li>
                    <li><strong>Office:</strong> Administration Building, Room 101</li>
                  </ul>
                </div>

                <div className="help-section">
                  <h3>❓ Frequently Asked Questions</h3>
                  <div className="faq-item">
                    <h4>How do I assign a grievance to myself?</h4>
                    <p>Only department admins can assign grievances. Use the "Assign to Me" button in the Grievance Queue.</p>
                  </div>
                  <div className="faq-item">
                    <h4>How do I mark a grievance as resolved?</h4>
                    <p>Go to "My Tasks" and click the "Mark Resolved" button on assigned grievances.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS VIEW */}
          {activeView === "notifications" && (
            <div className="view-container">
              <h1>Notifications</h1>
              <div className="notifications-list">
                <div className="notification-item unread">
                  <div className="notification-icon">🔔</div>
                  <div className="notification-content">
                    <h4>New Grievance Assigned</h4>
                    <p>Grievance "PDF Submission Issue" has been assigned to you</p>
                    <span className="notification-time">2 hours ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon">📋</div>
                  <div className="notification-content">
                    <h4>Grievance Status Updated</h4>
                    <p>Grievance "Library Books" status changed to "In Progress"</p>
                    <span className="notification-time">1 day ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon">✅</div>
                  <div className="notification-content">
                    <h4>Grievance Resolved</h4>
                    <p>Your grievance "WiFi Connectivity" has been resolved</p>
                    <span className="notification-time">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE VIEW */}
          {activeView === "profile" && (
            <div className="view-container">
              <h1>My Profile</h1>
              <div className="profile-content">
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="profile-info">
                    <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                    <p><strong>Role:</strong> {user.role === "admin" ? "Department Admin" : "Department Staff"}</p>
                    <p><strong>Email:</strong> {user.email || "user@college.edu"}</p>
                    <p><strong>Department:</strong> {user.department || "Computer Science"}</p>
                    <p><strong>Staff ID:</strong> {user.staff_id || "STAFF-001"}</p>
                  </div>
                </div>

                <div className="profile-section">
                  <h3>Account Settings</h3>
                  <button className="btn-primary">Change Password</button>
                  <button className="btn-secondary" style={{marginLeft: '10px'}}>Update Profile</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DepartmentDashboard;