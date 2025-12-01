import React, { useState } from 'react';
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
import ProfilePage from '../pages/ProfilePage';// New component
import './StudentDashboard.css';

const StudentDashboard = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [grievanceForFeedback, setGrievanceForFeedback] = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'status_update',
      title: 'Status Updated',
      message: 'GRV-2024-001: "Under Review" → "In Progress"',
      grievance_id: 'GRV-2024-001',
      timestamp: new Date().toISOString(),
      isRead: false
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Reminder',
      message: 'GRV-2024-003 needs your response - Deadline: Tomorrow',
      grievance_id: 'GRV-2024-003',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false
    },
    {
      id: 3,
      type: 'resolved',
      title: 'Resolved',
      message: 'GRV-2024-002 - Project Feedback: "Marks have been updated"',
      grievance_id: 'GRV-2024-002',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 4,
      type: 'new_response',
      title: 'New Response',
      message: 'Professor added a note to GRV-2024-005',
      grievance_id: 'GRV-2024-005',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      isRead: true
    }
  ]);

  const [grievances, setGrievances] = useState([
    {
      grievance_id: "GRV-2024-001",
      title: 'Project Grade Dispute',
      description: 'I believe my project deserves higher marks based on the rubric criteria. The evaluation seems inconsistent with the provided grading guidelines.',
      category_id: 1,
      priority: 'high',
      status: 'in-progress',
      created_at: '2024-01-20',
      has_attachments: true,
      assigned_to: 'Prof. Smith',
      department: 'Computer Science',
      department_id: 1,
      status_timeline: [
        { status: 'submitted', date: '2024-01-20', note: 'Grievance submitted successfully' },
        { status: 'under_review', date: '2024-01-21', note: 'Assigned to Prof. Smith for review' },
        { status: 'in-progress', date: '2024-01-22', note: 'Under investigation - awaiting response from faculty' }
      ],
      feedback: null // New field for feedback
    },
    {
      grievance_id: "GRV-2024-002",
      title: 'Library Books Not Available',
      description: 'Required textbooks for CS-301 are always issued to other students. Need urgent access for semester preparation.',
      category_id: 2,
      priority: 'medium',
      status: 'resolved',
      created_at: '2024-01-22',
      has_attachments: false,
      assigned_to: 'Library Staff',
      department: 'Library',
      department_id: 8,
      status_timeline: [
        { status: 'submitted', date: '2024-01-22', note: 'Grievance submitted successfully' },
        { status: 'resolved', date: '2024-01-23', note: 'Books reserved and available for pickup' }
      ],
      feedback: null // No feedback given yet
    },
    {
      grievance_id: "GRV-2024-003",
      title: 'WiFi Connectivity Issues',
      description: 'Poor internet connection in the computer lab during practical sessions affecting online submissions.',
      category_id: 2,
      priority: 'high',
      status: 'under_review',
      created_at: '2024-01-18',
      has_attachments: true,
      assigned_to: 'IT Department',
      department: 'Infrastructure',
      department_id: 10,
      status_timeline: [
        { status: 'submitted', date: '2024-01-18', note: 'Grievance submitted successfully' },
        { status: 'under_review', date: '2024-01-19', note: 'IT team investigating connectivity issues' }
      ],
      feedback: null
    }
  ]);

  const [categories] = useState([
    { category_id: 1, category_name: 'Academic' },
    { category_id: 2, category_name: 'Infrastructure' },
    { category_id: 3, category_name: 'Administrative' },
    { category_id: 4, category_name: 'Financial' },
    { category_id: 5, category_name: 'Other' }
  ]);

  // Feedback functions
  const handleGiveFeedback = (grievance) => {
    setGrievanceForFeedback(grievance);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = (feedbackData) => {
    const { rating, comment } = feedbackData;

    setGrievances(prevGrievances =>
      prevGrievances.map(g =>
        g.grievance_id === grievanceForFeedback.grievance_id
          ? {
              ...g,
              feedback: {
                rating,
                comment,
                submitted_at: new Date().toISOString()
              }
            }
          : g
      )
    );

    setShowFeedbackModal(false);
    setGrievanceForFeedback(null);

    // Show success message
    alert('✅ Thank you for your feedback! Your response has been recorded.');
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setGrievanceForFeedback(null);
  };

  // Get resolved grievances that don't have feedback yet
  const getGrievancesNeedingFeedback = () => {
    return grievances.filter(g => g.status === 'resolved' && !g.feedback);
  };

  // Notification functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  const handleNotificationView = (grievanceId) => {
    const grievance = grievances.find(g => g.grievance_id === grievanceId);
    if (grievance) {
      setSelectedGrievance(grievance);
      setActiveView('grievance-details');
    }
  };

  // Generate unique IDs
  const generateGrievanceId = () => {
    const year = new Date().getFullYear();
    const count = grievances.length + 1;
    return `GRV-${year}-${count.toString().padStart(3, '0')}`;
  };

  const addGrievance = (newGrievance) => {
    const grievance = {
      grievance_id: generateGrievanceId(),
      ...newGrievance,
      status: 'submitted',
      created_at: new Date().toISOString(),
      has_attachments: false,
      assigned_to: 'Not assigned',
      status_timeline: [
        {
          status: 'submitted',
          date: new Date().toISOString(),
          note: 'Grievance submitted successfully'
        }
      ],
      feedback: null
    };

    console.log('New grievance created:', grievance);

    setGrievances([...grievances, grievance]);
    setSelectedGrievance(grievance);
    setActiveView('grievance-details');

    // Show success message
    setTimeout(() => {
      alert(`✅ Grievance Submitted Successfully!\n\n📋 Grievance ID: ${grievance.grievance_id}\n\n💡 Save this ID to track your grievance status anytime using the "Track Grievance" feature.`);
    }, 100);
  };

  // Update grievance functionality
  const updateGrievance = (updatedData) => {
    setGrievances(grievances.map(g =>
      g.grievance_id === selectedGrievance.grievance_id
        ? {
            ...g,
            ...updatedData,
            created_at: g.created_at,
            status_timeline: g.status_timeline
          }
        : g
    ));
    setActiveView('my-grievances');
    alert('✅ Grievance updated successfully!');
  };

  const findGrievanceById = (grievanceId) => {
    return grievances.find(g => g.grievance_id === grievanceId.toUpperCase());
  };

  const handleViewGrievanceDetails = (grievance) => {
    setSelectedGrievance(grievance);
    setActiveView('grievance-details');
  };

  // Edit grievance functionality
  const handleEditGrievance = (grievance) => {
    setSelectedGrievance(grievance);
    setActiveView('edit-grievance');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    closeSidebar();
  };

  // Get sorted grievances for dashboard (newest first)
  const getSortedGrievances = () => {
    return [...grievances].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const renderActiveView = () => {
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
              onGrievanceSubmit={updateGrievance}
              editGrievance={selectedGrievance}
            />
          </div>
        );
      case 'my-grievances':
        return (
          <div className="view-container">
            <h2 className="view-title">My Grievances</h2>
            <GrievanceList
              grievances={grievances}
              categories={categories}
              onViewDetails={handleViewGrievanceDetails}
              onEditGrievance={handleEditGrievance}
              onGiveFeedback={handleGiveFeedback} // Pass feedback function
            />
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
              grievance={selectedGrievance}
              categories={categories}
              onBack={() => setActiveView('my-grievances')}
              onGiveFeedback={handleGiveFeedback} // Pass feedback function
            />
          </div>
        );
      case 'quick-stats':
        return (
          <div className="view-container">
            <h2 className="view-title">Quick Stats</h2>
            <QuickStats grievances={grievances} />
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
        const sortedGrievances = getSortedGrievances();
        const recentGrievances = sortedGrievances.slice(0, 3);
        const grievancesNeedingFeedback = getGrievancesNeedingFeedback();

        return (
          <div className="dashboard-main">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-content">
                <h1>Hello, {user.first_name}! 👋</h1>
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
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-section">
              <QuickStats grievances={grievances} />
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
        />
      )}
    </div>
  );
};

export default StudentDashboard;