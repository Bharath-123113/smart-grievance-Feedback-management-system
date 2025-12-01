import React, { useState } from "react";
import "./DepartmentDashboard.css";

const AdminDashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [assignStaffId, setAssignStaffId] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Sample data
  const staffMembers = [
    { id: 1, name: "Prof. Sharma", department: "Computer Science", email: "sharma@college.edu" },
    { id: 2, name: "Dr. Gupta", department: "Computer Science", email: "gupta@college.edu" },
    { id: 3, name: "Prof. Kumar", department: "Electrical Engineering", email: "kumar@college.edu" },
    { id: 4, name: "Dr. Singh", department: "Mechanical Engineering", email: "singh@college.edu" },
    { id: 5, name: "Prof. Patel", department: "Library", email: "patel@college.edu" }
  ];

  const [grievances, setGrievances] = useState([
    {
      id: 1,
      title: "WiFi Connectivity Issues",
      student: "Ajay Kumar",
      department: "Computer Science",
      status: "new",
      priority: "high",
      description: "WiFi connection is down in the entire 3rd floor of CS building.",
      submitted: "2 hours ago",
      grievanceId: "CRY-X2024-001",
      assignedTo: null
    },
    {
      id: 2,
      title: "Library Books Not Available",
      student: "Priya Sharma",
      department: "Library",
      status: "new",
      priority: "medium",
      description: "Required textbooks for CS-301 are always issued to other students.",
      submitted: "5 hours ago",
      grievanceId: "CRY-X2024-002",
      assignedTo: null
    },
    {
      id: 3,
      title: "Project Grade Dispute",
      student: "Rahul Verma",
      department: "Computer Science",
      status: "new",
      priority: "high",
      description: "I believe my project deserves higher marks based on the rubric criteria.",
      submitted: "1 day ago",
      grievanceId: "CRY-X2024-003",
      assignedTo: null
    },
    {
      id: 4,
      title: "Lab Equipment Maintenance",
      student: "Anita Desai",
      department: "Computer Science",
      status: "in-progress",
      priority: "medium",
      description: "Computers in Lab 3 are running very slow and need maintenance.",
      submitted: "3 hours ago",
      grievanceId: "CRY-X2024-004",
      assignedTo: "Prof. Sharma"
    }
  ]);

  const systemStats = {
    totalUsers: 156,
    activeGrievances: grievances.filter(g => g.status !== 'resolved').length,
    departments: 8,
    resolutionRate: 67
  };

  // Handle view changes
  const handleViewChange = (view) => {
    setActiveView(view);
    closeSidebar();
  };

  // Assign grievance to staff
  const assignGrievance = (grievanceId, staffId) => {
    const staff = staffMembers.find(s => s.id === parseInt(staffId));
    if (!staff) {
      alert("Please select a staff member");
      return;
    }

    setGrievances(prev =>
      prev.map(g =>
        g.id === grievanceId
          ? { ...g, assignedTo: staff.name, status: "in-progress" }
          : g
      )
    );

    setAssignStaffId("");
    setSelectedGrievance(null);
    alert(`✅ Grievance assigned to ${staff.name}`);
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch(action) {
      case "Manage Users":
        setActiveView("users");
        break;
      case "Department Management":
        setActiveView("departments");
        break;
      case "System Analytics":
        setActiveView("analytics");
        break;
      case "System Settings":
        setActiveView("settings");
        break;
      default:
        alert(`Action: ${action}`);
    }
  };

  // Get staff by department
  const getStaffByDepartment = (department) => {
    return staffMembers.filter(staff => staff.department === department);
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
              SUPER ADMIN DASHBOARD
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
              className={`menu-item ${activeView === "users" ? "active" : ""}`}
              onClick={() => handleViewChange("users")}
            >
              👥 User Management
            </div>

            <div
              className={`menu-item ${activeView === "departments" ? "active" : ""}`}
              onClick={() => handleViewChange("departments")}
            >
              🏢 Department Management
            </div>

            <div
              className={`menu-item ${activeView === "grievances" ? "active" : ""}`}
              onClick={() => handleViewChange("grievances")}
            >
              📋 All Grievances
            </div>

            <div
              className={`menu-item ${activeView === "analytics" ? "active" : ""}`}
              onClick={() => handleViewChange("analytics")}
            >
              📈 System Analytics
            </div>

            <h4>Admin Controls</h4>

            <div
              className={`menu-item ${activeView === "settings" ? "active" : ""}`}
              onClick={() => handleViewChange("settings")}
            >
              ⚙️ System Settings
            </div>

            <div
              className={`menu-item ${activeView === "reports" ? "active" : ""}`}
              onClick={() => handleViewChange("reports")}
            >
              📊 Reports
            </div>

            <div
              className={`menu-item ${activeView === "security" ? "active" : ""}`}
              onClick={() => handleViewChange("security")}
            >
              🔐 Security
            </div>

            <h4>Support</h4>

            <div
              className={`menu-item ${activeView === "notifications" ? "active" : ""}`}
              onClick={() => handleViewChange("notifications")}
            >
              🔔 Notifications <span className="badge">5</span>
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
                <p>System overview and management dashboard.</p>
              </div>

              <div className="quick-actions">
                <button
                  className="action-btn"
                  onClick={() => handleQuickAction("Manage Users")}
                >
                  👥 Manage Users
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleQuickAction("Department Management")}
                >
                  🏢 Departments
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleQuickAction("System Analytics")}
                >
                  📈 Analytics
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleQuickAction("System Settings")}
                >
                  ⚙️ Settings
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{systemStats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>

                <div className="stat-card">
                  <h3>{systemStats.activeGrievances}</h3>
                  <p>Active Grievances</p>
                </div>

                <div className="stat-card">
                  <h3>{systemStats.departments}</h3>
                  <p>Departments</p>
                </div>

                <div className="stat-card">
                  <h3>{systemStats.resolutionRate}%</h3>
                  <p>Resolution Rate</p>
                </div>
              </div>

              {/* Recent Grievances Section */}
              <div className="recent-grievances">
                <h2>Recent Grievances - Need Assignment</h2>
                <div className="grievance-list">
                  {grievances
                    .filter(g => g.status === "new")
                    .slice(0, 3)
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
                        <span>Status: 🆕 New</span>
                        <span>Submitted: {g.submitted}</span>
                      </div>
                      <div className="grievance-actions">
                        <button
                          className="btn-small btn-primary"
                          onClick={() => {
                            setSelectedGrievance(g);
                            setActiveView("assign-grievance");
                          }}
                        >
                          👤 Assign Staff
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
                    <span><strong>Grievance ID:</strong> {selectedGrievance.grievanceId}</span>
                    <span><strong>Student:</strong> {selectedGrievance.student}</span>
                    <span><strong>Department:</strong> {selectedGrievance.department}</span>
                    <span><strong>Priority:</strong>
                      <span className={`priority-${selectedGrievance.priority}`}>
                        {selectedGrievance.priority}
                      </span>
                    </span>
                    <span><strong>Status:</strong> 🆕 New</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{selectedGrievance.description}</p>
                </div>

                <div className="detail-section status-update-form">
                  <h3>Assign to Staff Member</h3>

                  <div className="form-group">
                    <label>Select Staff from {selectedGrievance.department} Department *</label>
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                      className="status-select"
                    >
                      <option value="">Choose a staff member...</option>
                      {getStaffByDepartment(selectedGrievance.department).map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} - {staff.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignStaffId && (
                    <div className="staff-info">
                      <h4>Selected Staff:</h4>
                      <div className="staff-details">
                        <p><strong>Name:</strong> {staffMembers.find(s => s.id === parseInt(assignStaffId))?.name}</p>
                        <p><strong>Email:</strong> {staffMembers.find(s => s.id === parseInt(assignStaffId))?.email}</p>
                        <p><strong>Department:</strong> {staffMembers.find(s => s.id === parseInt(assignStaffId))?.department}</p>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={() => assignGrievance(selectedGrievance.id, assignStaffId)}
                    disabled={!assignStaffId}
                  >
                    ✅ Assign to Staff
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT VIEW */}
          {activeView === "users" && (
            <div>
              <h1>User Management</h1>
              <p>Manage all system users - Students, Staff, and Admins.</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>89</h3>
                  <p>Students</p>
                </div>
                <div className="stat-card">
                  <h3>52</h3>
                  <p>Staff Members</p>
                </div>
                <div className="stat-card">
                  <h3>15</h3>
                  <p>Admins</p>
                </div>
              </div>

              <div className="quick-actions">
                <button className="action-btn">➕ Add New User</button>
                <button className="action-btn">📧 Bulk Import</button>
                <button className="action-btn">📊 User Reports</button>
              </div>
            </div>
          )}

          {/* DEPARTMENT MANAGEMENT VIEW */}
          {activeView === "departments" && (
            <div>
              <h1>Department Management</h1>
              <p>Manage all departments and assign staff.</p>

              <div className="grievance-list">
                <div className="grievance-item">
                  <h3>Computer Science</h3>
                  <p>Department of Computer Science and Engineering</p>
                  <div className="grievance-meta">
                    <span><strong>Staff Count:</strong> 12</span>
                    <span><strong>Active Grievances:</strong> 8</span>
                    <span><strong>HOD:</strong> Prof. Rajesh Kumar</span>
                  </div>
                  <div className="grievance-actions">
                    <button className="btn-small btn-primary">Manage Staff</button>
                    <button className="btn-small btn-secondary">Edit Department</button>
                  </div>
                </div>

                <div className="grievance-item">
                  <h3>Electrical Engineering</h3>
                  <p>Department of Electrical and Electronics Engineering</p>
                  <div className="grievance-meta">
                    <span><strong>Staff Count:</strong> 8</span>
                    <span><strong>Active Grievances:</strong> 5</span>
                    <span><strong>HOD:</strong> Dr. Sunita Patel</span>
                  </div>
                  <div className="grievance-actions">
                    <button className="btn-small btn-primary">Manage Staff</button>
                    <button className="btn-small btn-secondary">Edit Department</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALL GRIEVANCES VIEW */}
          {activeView === "grievances" && (
            <div>
              <h1>All Grievances</h1>
              <p>View and manage grievances across all departments.</p>

              <div className="grievance-list">
                {grievances.map((g) => (
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
                      <span>Status:
                        <strong>
                          {g.status === 'new' && ' 🆕 New'}
                          {g.status === 'in-progress' && ' 🔄 In Progress'}
                          {g.status === 'resolved' && ' ✅ Resolved'}
                        </strong>
                      </span>
                      {g.assignedTo && <span>Assigned to: {g.assignedTo}</span>}
                    </div>
                    {g.status === "new" && (
                      <div className="grievance-actions">
                        <button
                          className="btn-small btn-primary"
                          onClick={() => {
                            setSelectedGrievance(g);
                            setActiveView("assign-grievance");
                          }}
                        >
                          👤 Assign Staff
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {activeView === "analytics" && (
            <div>
              <h1>System Analytics</h1>
              <p>Comprehensive system-wide analytics and reports.</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>42</h3>
                  <p>Grievances This Month</p>
                </div>
                <div className="stat-card">
                  <h3>67%</h3>
                  <p>Resolution Rate</p>
                </div>
                <div className="stat-card">
                  <h3>2.1</h3>
                  <p>Avg. Resolution Days</p>
                </div>
                <div className="stat-card">
                  <h3>92%</h3>
                  <p>Student Satisfaction</p>
                </div>
              </div>
            </div>
          )}

          {/* OTHER VIEWS */}
          {activeView === "settings" && (
            <div>
              <h1>System Settings</h1>
              <p>Configure system-wide settings and preferences.</p>
              <div className="grievance-list">
                <div className="grievance-item">
                  <h3>General Settings</h3>
                  <p>System name, logo, contact information, and basic configuration</p>
                  <button className="btn-small btn-primary">Configure</button>
                </div>
                <div className="grievance-item">
                  <h3>Email Settings</h3>
                  <p>SMTP configuration, email templates, and notification settings</p>
                  <button className="btn-small btn-primary">Configure</button>
                </div>
              </div>
            </div>
          )}

          {activeView === "reports" && (
            <div>
              <h1>Reports</h1>
              <p>Generate and view system reports.</p>
              <div className="quick-actions">
                <button className="action-btn">📊 Grievance Reports</button>
                <button className="action-btn">👥 User Reports</button>
                <button className="action-btn">🏢 Department Reports</button>
                <button className="action-btn">📈 Performance Reports</button>
              </div>
            </div>
          )}

          {activeView === "security" && (
            <div>
              <h1>Security</h1>
              <p>Manage system security and access controls.</p>
              <div className="grievance-list">
                <div className="grievance-item">
                  <h3>Access Control</h3>
                  <p>Manage user roles and permissions across the system</p>
                  <button className="btn-small btn-primary">Manage Roles</button>
                </div>
                <div className="grievance-item">
                  <h3>Audit Logs</h3>
                  <p>View system activity logs and user actions</p>
                  <button className="btn-small btn-primary">View Logs</button>
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
                    <h4>New Grievance Submitted</h4>
                    <p>New grievance "Project Grade Dispute" needs assignment</p>
                    <span className="notification-time">10 min ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon">📋</div>
                  <div className="notification-content">
                    <h4>Grievance Resolved</h4>
                    <p>Grievance "Library Books" has been resolved by Prof. Sharma</p>
                    <span className="notification-time">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "profile" && (
            <div className="view-container">
              <h1>My Profile</h1>
              <div className="profile-content">
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="profile-info">
                    <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                    <p><strong>Role:</strong> Super Administrator</p>
                    <p><strong>Email:</strong> {user.email || "admin@resolveit.edu"}</p>
                    <p><strong>Admin ID:</strong> ADMIN-001</p>
                    <p><strong>Access Level:</strong> Full System Access</p>
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

export default AdminDashboard;