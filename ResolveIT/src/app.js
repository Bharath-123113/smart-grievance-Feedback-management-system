import React, { useState, useEffect } from 'react';
import Login from './components/login/login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import DepartmentDashboard from './pages/DepartmentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import FirstLoginSetup from './pages/FirstLoginSetup';
import './app.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Check if user data exists in localStorage on app start
  useEffect(() => {
    console.log('🔍 App mounted - checking localStorage');
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');
    
    console.log('📦 localStorage data:', {
      savedUser,
      token: token ? 'Token exists' : 'No token',
      userData: userDataStr
    });

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('👤 User data from localStorage:', userData);
        setCurrentUser(userData);
        // Check if profile is completed
        const isProfileCompleted = userData.profileCompleted || userData.profile_completed;
        console.log('📋 Profile completed:', isProfileCompleted);
        setShowProfileSetup(!isProfileCompleted);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    } else if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        console.log('👤 User data from "user" key:', userData);
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setShowProfileSetup(!userData.profileCompleted);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    console.log('🚀 Login handler called with:', userData);
    
    const userWithDefaults = {
      ...userData,
      user_id: userData.user_id || Date.now(),
      profileCompleted: userData.profileCompleted || false
    };

    console.log('💾 Setting user:', userWithDefaults);
    setCurrentUser(userWithDefaults);
    localStorage.setItem('currentUser', JSON.stringify(userWithDefaults));

    // Only show profile setup if profile is not completed
    setShowProfileSetup(!userWithDefaults.profileCompleted);
  };

  const handleProfileComplete = (completeUser) => {
    const updatedUser = {
      ...completeUser,
      profileCompleted: true,
      profile_completed: true
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowProfileSetup(false);
  };

  const handleLogout = () => {
    console.log('👋 Logging out');
    setCurrentUser(null);
    setShowProfileSetup(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    if (!currentUser) {
      console.log('❌ No current user in renderDashboard');
      return null;
    }

    console.log('🔄 Rendering dashboard for user:', currentUser);
    console.log('🎭 User role:', currentUser.userType);

    switch(currentUser.userType) {
      case 'staff':
        console.log('➡️ Redirecting to Department Dashboard');
        return (
          <DepartmentDashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'department_admin':
      case 'super_admin':
      case 'admin':
        console.log('➡️ Redirecting to Admin Dashboard');
        return (
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'student':
        console.log('➡️ Redirecting to Student Dashboard');
        return (
          <StudentDashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        console.log('❓ Unknown role, defaulting to Student Dashboard');
        return (
          <StudentDashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        );
    }
  };

  console.log('🎬 App rendering state:', {
    currentUser: !!currentUser,
    showProfileSetup,
    userType: currentUser?.userType
  });

  return (
    <div className="App">
      {currentUser ? (
        showProfileSetup ? (
          <FirstLoginSetup
            user={currentUser}
            onComplete={handleProfileComplete}
          />
        ) : (
          renderDashboard()
        )
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;