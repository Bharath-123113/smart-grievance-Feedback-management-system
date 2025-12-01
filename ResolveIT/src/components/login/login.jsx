import React, { useState } from 'react';
import axios from 'axios';
import './login.css';

const Login = (props) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'student',
    firstName: '',
    lastName: '',
    email: ''
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newUserData, setNewUserData] = useState(null);

  // Map your frontend roles to backend roles
  const roleMapping = {
    'student': 'student',
    'staff': 'staff',
    'admin': 'department_admin'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const backendRole = roleMapping[formData.userType];

      const loginData = {
        username: formData.username,
        password: formData.password,
        role: backendRole
      };

      console.log('🔄 Sending login request:', loginData);

      // Call Spring Boot backend
      const response = await axios.post('http://localhost:8080/api/auth/login', loginData);

      if (response.data.token) {
        setMessage(`🎉 Login Successful! Welcome ${response.data.firstName}`);
        setMessageType('success');

        // Store user data
        const userData = {
          email: response.data.email,
          userType: response.data.role,
          first_name: response.data.firstName,
          last_name: response.data.lastName,
          userId: response.data.userId,
          profileCompleted: true,
          token: response.data.token,
        };

        // Store token for future API calls
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // ROLE-BASED REDIRECT
        const userRole = response.data.role;
        console.log('User role:', userRole);
        
        if (userRole === 'student') {
          window.location.href = '/student-dashboard';
        } else if (userRole === 'staff') {
          window.location.href = '/staff-dashboard';
        } else if (userRole === 'department_admin' || userRole === 'super_admin') {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/student-dashboard';
        }

        if (props.onLogin) {
          props.onLogin(userData);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your username and password.';
      setMessage(`❌ ${errorMessage}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getDepartmentName = (departmentKey) => {
    const departments = {
      'academic': 'Academic Department',
      'administrative': 'Administrative Department',
      'infrastructure': 'Infrastructure Department',
      'library': 'Library Department',
      'computer_science': 'Computer Science Department'
    };
    return departments[departmentKey] || departmentKey;
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (formData.username) {
        setMessage(`📧 Password reset instructions sent for username: ${formData.username}`);
        setMessageType('success');
      } else {
        setMessage('❌ Please enter your username first.');
        setMessageType('error');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const { firstName, lastName, username, email, userType, password } = formData;

      // Convert frontend role to backend role
      const backendRole = roleMapping[userType];

      const signupData = {
        firstName: firstName,
        lastName: lastName,
        username: username, // User chooses their own username
        email: email,
        password: password,
        role: backendRole,
        phone: '',
        departmentId: 1
      };

      console.log('🔄 Sending signup request:', signupData);

      // Call Spring Boot signup API
      const response = await axios.post('http://localhost:8080/api/auth/signup', signupData);
      
      console.log('✅ Signup response:', response.data);

      if (response.data.success) {
        setMessage(`✅ ${response.data.message} 
        
🎉 **Account Created Successfully!**

🔐 **Your Login Details:**
**Username:** ${username}
**Role:** ${userType}

🔄 Auto-logging you in now...`);
        setMessageType('success');

        // Wait 3 seconds to let user read the message, then auto-login
        setTimeout(async () => {
          try {
            // Auto-login after successful signup using the chosen username
            const loginData = {
              username: username,
              password: password,
              role: backendRole
            };

            console.log('🔄 Auto-login with username:', loginData);

            const loginResponse = await axios.post('http://localhost:8080/api/auth/login', loginData);
            
            if (loginResponse.data.token) {
              const userData = {
                email: loginResponse.data.email,
                userType: loginResponse.data.role,
                first_name: loginResponse.data.firstName,
                last_name: loginResponse.data.lastName,
                userId: loginResponse.data.userId,
                profileCompleted: userType === 'student' ? false : true,
                token: loginResponse.data.token,
              };

              // Store user data
              localStorage.setItem('token', loginResponse.data.token);
              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('currentUser', JSON.stringify(userData));

              // Redirect based on role
              const userRole = loginResponse.data.role;
              if (userRole === 'student') {
                // Show student registration form
                setNewUserData(userData);
                setShowRegistrationForm(true);
              } else if (userRole === 'staff') {
                window.location.href = '/staff-dashboard';
              } else if (userRole === 'department_admin') {
                window.location.href = '/admin-dashboard';
              }
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            setMessage(`✅ Account created but auto-login failed. Please login manually with username: ${username}`);
            setIsLoading(false);
          }
        }, 3000); // 3 second delay

      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || 'Signup failed. Please try again.';
      setMessage(`❌ ${errorMessage}`);
      setMessageType('error');
      setIsLoading(false);
    }
  };

  // Handle registration form completion
  const handleRegistrationComplete = (registrationData) => {
    const completeUser = {
      ...newUserData,
      ...registrationData,
      profileCompleted: true,
      department_name: getDepartmentName(registrationData.department)
    };

    // Update user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(completeUser));
    
    // Redirect to student dashboard
    window.location.href = '/student-dashboard';

    if (props.onLogin) {
      props.onLogin(completeUser);
    }
  };

  // Render registration form for students
  const renderRegistrationForm = () => (
    <div className="registration-section">
      <div className="setup-header">
        <h1>🎓 Complete Your Profile</h1>
        <p>Welcome to ResolveIT! Please complete your academic information to get started.</p>
      </div>

      <form className="setup-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-section">
          <h3>Personal Information</h3>

          <div className="form-group">
            <label>Student ID *</label>
            <input
              type="text"
              name="student_id"
              placeholder="Enter your student ID"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 9876543210"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              placeholder="Enter your current address"
              rows="3"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Academic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Academic Year *</label>
              <select className="form-input" name="academic_year" required>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>

            <div className="form-group">
              <label>Program *</label>
              <select className="form-input" name="program" required>
                <option value="Bachelor of Technology">Bachelor of Technology</option>
                <option value="Bachelor of Science">Bachelor of Science</option>
                <option value="Bachelor of Arts">Bachelor of Arts</option>
                <option value="Bachelor of Commerce">Bachelor of Commerce</option>
                <option value="Master of Technology">Master of Technology</option>
                <option value="Master of Science">Master of Science</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Semester *</label>
              <select className="form-input" name="semester" required>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="5">5th Semester</option>
                <option value="6">6th Semester</option>
                <option value="7">7th Semester</option>
                <option value="8">8th Semester</option>
              </select>
            </div>

            <div className="form-group">
              <label>Current GPA *</label>
              <select className="form-input" name="gpa" required>
                <option value="4.0">4.0</option>
                <option value="3.75">3.75</option>
                <option value="3.5">3.5</option>
                <option value="3.25">3.25</option>
                <option value="3.0">3.0</option>
                <option value="2.75">2.75</option>
                <option value="2.5">2.5</option>
                <option value="2.25">2.25</option>
                <option value="2.0">2.0</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Department *</label>
            <select className="form-input" name="department" required>
              <option value="computer_science">Computer Science</option>
              <option value="electrical_engineering">Electrical Engineering</option>
              <option value="mechanical_engineering">Mechanical Engineering</option>
              <option value="civil_engineering">Civil Engineering</option>
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="business_administration">Business Administration</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="submit-btn"
            onClick={() => {
              const registrationData = {
                student_id: document.querySelector('[name="student_id"]').value,
                phone: document.querySelector('[name="phone"]').value,
                address: document.querySelector('[name="address"]').value,
                academic_year: document.querySelector('[name="academic_year"]').value,
                program: document.querySelector('[name="program"]').value,
                semester: document.querySelector('[name="semester"]').value,
                gpa: document.querySelector('[name="gpa"]').value,
                department: document.querySelector('[name="department"]').value,
                registration_date: new Date().toISOString(),
                member_since: new Date().toISOString(),
                account_status: 'Active'
              };
              handleRegistrationComplete(registrationData);
            }}
          >
            Complete Registration & Continue
          </button>
        </div>
      </form>
    </div>
  );

  const renderLoginForm = () => (
    <form className="login-form" onSubmit={handleLoginSubmit}>
      <div className="form-group">
        <label>Username *</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your username"
          className="form-input"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <small className="input-hint">
        </small>
      </div>

      <div className="form-group">
        <label>Password *</label>
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          className="form-input"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>I am a</label>
        <select
          className="form-input"
          name="userType"
          value={formData.userType}
          onChange={handleInputChange}
        >
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <button
        type="submit"
        className="login-btn"
        disabled={isLoading}
      >
        {isLoading ? '🔄 Logging in...' : '🚀 Login to ResolveIT'}
      </button>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form className="login-form" onSubmit={handleForgotPassword}>
      <div className="form-group">
        <label>Enter your username</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your username"
          className="form-input"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
      </div>

      <p className="info-text">
        We'll send password reset instructions to your registered email.
      </p>

      <button
        type="submit"
        className="login-btn"
        disabled={isLoading}
      >
        {isLoading ? '🔄 Sending...' : '📧 Reset Password'}
      </button>
    </form>
  );

  const renderSignupForm = () => (
    <form className="login-form" onSubmit={handleSignup}>
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            className="form-input"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            className="form-input"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Choose Username *</label>
        <input
          type="text"
          name="username"
          placeholder="Create your username (e.g., john_doe2024)"
          className="form-input"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <small className="input-hint">
          This will be your login username. Choose something memorable.
        </small>
      </div>

      <div className="form-group">
        <label>Email Address *</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your college email"
          className="form-input"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Create Password *</label>
        <input
          type="password"
          name="password"
          placeholder="Create a strong password"
          className="form-input"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>I am a *</label>
        <select
          className="form-input"
          name="userType"
          value={formData.userType}
          onChange={handleInputChange}
          required
        >
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <button
        type="submit"
        className="login-btn"
        disabled={isLoading}
      >
        {isLoading ? '🔄 Creating Account...' : '📝 Create Account'}
      </button>
    </form>
  );

  // If showing registration form, render it
  if (showRegistrationForm) {
    return (
      <div className="login-container">
        <div className="login-card">
          {renderRegistrationForm()}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ResolveIT</h1>
          <p>Smart Grievance Management System</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Render Active Form */}
        {activeTab === 'login' && renderLoginForm()}
        {activeTab === 'forgot' && renderForgotPasswordForm()}
        {activeTab === 'signup' && renderSignupForm()}

        {/* Footer Links */}
        <div className="login-footer">
          {activeTab === 'login' && (
            <>
              <a href="#forgot" onClick={() => setActiveTab('forgot')}>Forgot Password?</a>
              <span> • </span>
              <a href="#signup" onClick={() => setActiveTab('signup')}>Sign Up Here</a>
            </>
          )}
          {activeTab === 'forgot' && (
            <a href="#login" onClick={() => setActiveTab('login')}>← Back to Login</a>
          )}
          {activeTab === 'signup' && (
            <a href="#login" onClick={() => setActiveTab('login')}>← Back to Login</a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;