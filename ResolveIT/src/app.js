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
      savedUser: savedUser ? 'Exists' : 'Not found',
      token: token ? 'Token exists' : 'No token',
      userData: userDataStr ? 'Exists' : 'Not found'
    });

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('👤 User data from localStorage:', userData);
        
        // FIXED: Check ONLY profileCompleted flag, NOT profile fields
        const isProfileCompleted = 
          userData.profileCompleted === true || 
          userData.profile_completed === true;
          // REMOVED: hasProfileFields check - this was causing the issue
        
        console.log('📋 Profile completed check:', {
          profileCompleted: userData.profileCompleted,
          profile_completed: userData.profile_completed,
          isProfileCompleted: isProfileCompleted
        });
        
        setCurrentUser(userData);
        setShowProfileSetup(!isProfileCompleted);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('currentUser');
      }
    } else if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        console.log('👤 User data from "user" key:', userData);
        
        // FIXED: Same fix here - check only profileCompleted flag
        const isProfileCompleted = 
          userData.profileCompleted === true || 
          userData.profile_completed === true;
        
        console.log('📋 Profile completion check:', {
          profileCompleted: userData.profileCompleted,
          isProfileCompleted: isProfileCompleted
        });
        
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setShowProfileSetup(!isProfileCompleted);
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
      // Make sure profileCompleted is a boolean - default to false
      profileCompleted: userData.profileCompleted === true ? true : false
    };

    console.log('💾 Setting user:', userWithDefaults);
    setCurrentUser(userWithDefaults);
    localStorage.setItem('currentUser', JSON.stringify(userWithDefaults));

    // FIXED: Show profile setup ONLY if profileCompleted is false
    // Don't check isNewUser because backend always returns name fields
    const shouldShowProfileSetup = userWithDefaults.profileCompleted === false;
    console.log('🎯 Should show profile setup?', shouldShowProfileSetup, {
      profileCompleted: userWithDefaults.profileCompleted
    });
    
    setShowProfileSetup(shouldShowProfileSetup);
  };

  const handleProfileComplete = (completeUser) => {
    console.log('✅ Profile completion handler called with:', completeUser);
    
    const updatedUser = {
      ...completeUser,
      profileCompleted: true,
      profile_completed: true
    };

    console.log('📝 Updated user after profile completion:', updatedUser);
    
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowProfileSetup(false);
    
    // Optional: Force a small delay to ensure state updates
    setTimeout(() => {
      console.log('🔄 Profile setup completed, state updated');
    }, 100);
  };

  const handleLogout = () => {
    console.log('👋 Logging out - Clearing all data');
    
    // Clear ALL localStorage items
    localStorage.clear(); // This clears everything
    
    // Clear any session storage too
    sessionStorage.clear();
    
    // Reset state
    setCurrentUser(null);
    setShowProfileSetup(false);
    
    // Force a complete page reload to reset everything
    window.location.href = '/';
    window.location.reload(); // Double reload to ensure clean state
  };

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    if (!currentUser) {
      console.log('❌ No current user in renderDashboard');
      return null;
    }

    console.log('🔄 Rendering dashboard for user:', {
      email: currentUser.email,
      userType: currentUser.userType,
      profileCompleted: currentUser.profileCompleted,
      showProfileSetup: showProfileSetup
    });

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
    currentUserEmail: currentUser?.email,
    currentUserType: currentUser?.userType,
    showProfileSetup,
    userType: currentUser?.userType,
    profileCompleted: currentUser?.profileCompleted
  });

  return (
    <div className="App">
      {currentUser ? (
        showProfileSetup ? (
          <>
            <div style={{ padding: '20px', background: '#f0f0f0' }}>
              <h2>⚠️ Profile Setup Required</h2>
              <p>Please complete your profile to continue.</p>
            </div>
            <FirstLoginSetup
              user={currentUser}
              onComplete={handleProfileComplete}
            />
          </>
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