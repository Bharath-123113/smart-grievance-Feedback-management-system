import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './login.css';

const Login = (props) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'student',
    firstName: '',
    lastName: '',
    email: '',
    departmentId: ''  // ADDED: For staff/admin department selection
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  
  // State for departments
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Map your frontend roles to backend roles
  const roleMapping = {
    'student': 'student',
    'staff': 'staff',
    'admin': 'admin'
  };

  // Fetch departments when registration form OR signup form is shown
  useEffect(() => {
    if (showRegistrationForm || activeTab === 'signup') {
      fetchDepartments();
    }
  }, [showRegistrationForm, activeTab]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const token = localStorage.getItem('token');
      
      // Try to fetch departments with token if available
      // Otherwise fetch without token (for signup page)
      let response;
      if (token) {
        response = await axios.get('http://localhost:8080/api/dashboard/student/departments', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // For signup page, try without token or use a public endpoint
        response = await axios.get('http://localhost:8080/api/dashboard/student/departments');
      }
      
      console.log('Departments fetched:', response.data);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback to hardcoded departments
      setDepartments([
        { id: 1, departmentName: 'Computer Science', departmentCode: 'CSE' },
        { id: 2, departmentName: 'Infrastructure', departmentCode: 'INFRA' },
        { id: 3, departmentName: 'Administration', departmentCode: 'ADMIN' },
        { id: 4, departmentName: 'Electronics & Communication Engineering', departmentCode: 'ECE' },
        { id: 5, departmentName: 'Electrical & Electronics Engineering', departmentCode: 'EEE' },
        { id: 6, departmentName: 'Mechanical Engineering', departmentCode: 'MECH' },
        { id: 7, departmentName: 'Civil Engineering', departmentCode: 'CIVIL' },
        { id: 8, departmentName: 'AI & Data Science', departmentCode: 'AIDS' },
        { id: 9, departmentName: 'Computer Science & Business Systems', departmentCode: 'CSBS' },
        { id: 10, departmentName: 'Information Technology', departmentCode: 'IT' },
        { id: 11, departmentName: 'AI & Machine Learning', departmentCode: 'AIML' }
      ]);
    } finally {
      setLoadingDepartments(false);
    }
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
      
      console.log('🔐 Full backend login response:', response.data);

      if (response.data.token) {
        setMessage(`🎉 Login Successful! Welcome ${response.data.firstName}`);
        setMessageType('success');

        // Store user data - FIXED: Default profileCompleted to false, not true
        const userData = {
          email: response.data.email,
          userType: response.data.role,
          first_name: response.data.firstName,
          last_name: response.data.lastName,
          userId: response.data.userId,
          // FIXED: Default to false if not provided
          profileCompleted: response.data.profileCompleted !== undefined ? 
                          response.data.profileCompleted : false,
          token: response.data.token,
        };

        console.log('📝 Setting user profileCompleted to:', userData.profileCompleted);

        // Store token for future API calls
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // ALWAYS call props.onLogin - let App.js handle registration
        if (props.onLogin) {
          console.log('📤 Sending user data to App.js:', {
            email: userData.email,
            profileCompleted: userData.profileCompleted,
            userType: userData.userType
          });
          props.onLogin(userData);
        }

        // ROLE-BASED LOGGING (no redirection logic here)
        const userRole = response.data.role;
        console.log('✅ Login processed for role:', userRole);
        
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
      const { firstName, lastName, username, email, userType, password, departmentId } = formData;

      // Convert frontend role to backend role
      const backendRole = roleMapping[userType];

      // Determine departmentId based on role
      let deptId;
      
      if (userType === 'student') {
        // Students get department later in registration form
        deptId = 1; // Default for student signup
      } else if (userType === 'staff' || userType === 'admin') {
        // Staff/Admin must select department during signup
        if (!departmentId) {
          setMessage('❌ Please select a department for staff/admin account');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        deptId = parseInt(departmentId);
      } else {
        deptId = 1; // Default fallback
      }

      const signupData = {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        password: password,
        role: backendRole,
        phone: '',
        departmentId: deptId  // Use determined departmentId
      };

      console.log('🔄 Sending signup request:', signupData);

      const response = await axios.post('http://localhost:8080/api/auth/signup', signupData);
      
      console.log('✅ Signup response:', response.data);

      if (response.data.success) {
        setMessage(`✅ ${response.data.message} 
        
🎉 **Account Created Successfully!**

🔐 **Your Login Details:**
**Username:** ${username}
**Role:** ${userType}
**Department:** ${departments.find(d => d.id === deptId)?.departmentName || 'Not specified'}

🔄 Auto-logging you in now...`);
        setMessageType('success');

        setTimeout(async () => {
          try {
            const loginData = {
              username: username,
              password: password,
              role: backendRole
            };

            const loginResponse = await axios.post('http://localhost:8080/api/auth/login', loginData);
            
            console.log('🔐 Auto-login response:', loginResponse.data);
            
            if (loginResponse.data.token) {
              const userData = {
                email: loginResponse.data.email,
                userType: loginResponse.data.role,
                first_name: loginResponse.data.firstName,
                last_name: loginResponse.data.lastName,
                userId: loginResponse.data.userId,
                // FIXED: Default to false if not provided
                profileCompleted: loginResponse.data.profileCompleted !== undefined ? 
                                loginResponse.data.profileCompleted : false,
                token: loginResponse.data.token,
              };

              console.log('📝 Auto-login user profileCompleted:', userData.profileCompleted);

              localStorage.setItem('token', loginResponse.data.token);
              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('currentUser', JSON.stringify(userData));

              // ALWAYS call props.onLogin for signup auto-login
              if (props.onLogin) {
                console.log('📤 Signup auto-login sending to App.js:', {
                  email: userData.email,
                  profileCompleted: userData.profileCompleted,
                  userType: userData.userType
                });
                props.onLogin(userData);
              }

              console.log('✅ Signup completed, user data sent to App.js');
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            setMessage(`✅ Account created but auto-login failed. Please login manually with username: ${username}`);
            setIsLoading(false);
          }
        }, 3000);
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
  const handleRegistrationComplete = async () => {
    try {
      setSavingProfile(true);
      
      // Get form values
      const student_id = document.querySelector('[name="student_id"]').value;
      const phone = document.querySelector('[name="phone"]').value;
      const address = document.querySelector('[name="address"]').value;
      const academic_year = document.querySelector('[name="academic_year"]').value;
      const program = document.querySelector('[name="program"]').value;
      const semester = document.querySelector('[name="semester"]').value;
      const gpa = document.querySelector('[name="gpa"]').value;
      const department_id = document.querySelector('[name="department_id"]').value;
      
      const registrationData = {
        student_id,
        phone,
        address,
        academic_year,
        program,
        semester,
        gpa,
        department_id
      };
      
      console.log('📝 Registration data:', registrationData);
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Session expired. Please login again.');
        setSavingProfile(false);
        return;
      }
      
      // Validate GPA
      const gpaNum = parseFloat(gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
        alert('Please enter a valid GPA between 0 and 10');
        setSavingProfile(false);
        return;
      }
      
      // Validate required fields
      if (!student_id.trim()) {
        alert('Please enter your Student ID');
        setSavingProfile(false);
        return;
      }
      
      if (!department_id) {
        alert('Please select a department');
        setSavingProfile(false);
        return;
      }
      
      // Prepare data for backend API
      const profileData = {
        enrollmentNumber: student_id || '',
        phone: phone || '',
        address: address || '',
        academicYear: academic_year || '2024-2025',
        program: program || 'Bachelor of Technology',
        semester: semester ? parseInt(semester) : 4,
        gpa: gpaNum,
        firstName: newUserData?.first_name || '',
        lastName: newUserData?.last_name || '',
        email: newUserData?.email || '',
        departmentId: parseInt(department_id)
      };
      
      console.log('📤 Sending to backend API:', profileData);
      
      // Call backend API
      const response = await axios.put(
        'http://localhost:8080/api/dashboard/student/profile',
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Registration data saved:', response.data);
      
      // Complete the setup
      const completeUser = {
        ...newUserData,
        ...registrationData,
        profileCompleted: true
      };
      
      localStorage.setItem('currentUser', JSON.stringify(completeUser));
      
      // Notify parent component (App.js)
      if (props.onLogin) {
        console.log('✅ Registration complete - calling onLogin with complete user');
        props.onLogin(completeUser);
      }
      
    } catch (error) {
      console.error('❌ Error saving registration data:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
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
              <input
                type="text"
                name="gpa"
                placeholder="Enter your GPA (0-10)"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Department *</label>
            {loadingDepartments ? (
              <select className="form-input" disabled>
                <option>Loading departments...</option>
              </select>
            ) : (
              <select className="form-input" name="department_id" required>
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.departmentName} ({dept.departmentCode})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="submit-btn"
            onClick={handleRegistrationComplete}
            disabled={savingProfile}
          >
            {savingProfile ? '🔄 Saving...' : 'Complete Registration & Continue'}
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

      {/* ADDED: Department selection for staff/admin */}
      {(formData.userType === 'staff' || formData.userType === 'admin') && (
        <div className="form-group">
          <label>Department *</label>
          {loadingDepartments ? (
            <select className="form-input" disabled>
              <option>Loading departments...</option>
            </select>
          ) : (
            <select
              className="form-input"
              name="departmentId"
              value={formData.departmentId || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName} ({dept.departmentCode})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

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