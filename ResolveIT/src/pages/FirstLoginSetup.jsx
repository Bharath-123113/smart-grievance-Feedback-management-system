import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FirstLoginSetup.css';

const FirstLoginSetup = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    academic_year: '2024-2025',
    program: 'Bachelor of Technology',
    semester: '4',
    gpa: '', // Changed from dropdown to free text input
    department_id: '',
    department_name: '',
    phone: '',
    address: ''
  });

  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gpaError, setGpaError] = useState('');

  const programs = [
    'Bachelor of Technology',
    'Bachelor of Science',
    'Bachelor of Arts',
    'Bachelor of Commerce',
    'Master of Technology',
    'Master of Science',
    'PhD'
  ];

  // Fetch departments from backend on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:8080/api/dashboard/student/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📋 Departments fetched:', response.data);
      setDepartments(response.data);
      
      // Auto-select first department if none selected
      if (response.data.length > 0 && !formData.department_id) {
        const firstDept = response.data[0];
        setFormData(prev => ({
          ...prev,
          department_id: firstDept.id,
          department_name: firstDept.departmentName
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      // Fallback to hardcoded departments if API fails
      setDepartments([
        { id: 1, departmentName: 'Computer Science', departmentCode: 'CSE' },
        { id: 2, departmentName: 'Infrastructure', departmentCode: 'INFRA' },
        { id: 3, departmentName: 'Administration', departmentCode: 'ADMIN' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'department_id') {
      const selectedDept = departments.find(dept => dept.id.toString() === value);
      setFormData({
        ...formData,
        department_id: value,
        department_name: selectedDept ? selectedDept.departmentName : ''
      });
    } else if (name === 'gpa') {
      // Validate GPA input
      const gpaValue = value.trim();
      if (gpaValue === '' || /^\d*\.?\d*$/.test(gpaValue)) {
        // Allow empty or numeric input
        if (gpaValue !== '' && (parseFloat(gpaValue) < 0 || parseFloat(gpaValue) > 10)) {
          setGpaError('GPA must be between 0 and 10');
        } else {
          setGpaError('');
        }
        setFormData({
          ...formData,
          [name]: gpaValue
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateGPA = (gpa) => {
    if (!gpa || gpa.trim() === '') {
      return 'GPA is required';
    }
    const gpaNum = parseFloat(gpa);
    if (isNaN(gpaNum)) {
      return 'Please enter a valid number';
    }
    if (gpaNum < 0 || gpaNum > 10) {
      return 'GPA must be between 0 and 10';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate GPA
    const gpaErrorMsg = validateGPA(formData.gpa);
    if (gpaErrorMsg) {
      setGpaError(gpaErrorMsg);
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Prepare data for backend
      const profileData = {
        enrollmentNumber: formData.student_id,
        phone: formData.phone,
        address: formData.address,
        academicYear: formData.academic_year,
        program: formData.program,
        semester: parseInt(formData.semester),
        gpa: parseFloat(formData.gpa), // Convert to float
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        departmentId: parseInt(formData.department_id)
      };
      
      console.log('📤 Sending profile data:', profileData);
      
      // Call backend API to save profile
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
      
      console.log('✅ Profile saved:', response.data);
      
      // Complete the setup
      const completeUserProfile = {
        ...user,
        ...formData,
        department: departments.find(d => d.id.toString() === formData.department_id)?.departmentName,
        profile_completed: true,
        registration_date: new Date().toISOString(),
        member_since: new Date().toISOString(),
        account_status: 'Active'
      };
      
      onComplete(completeUserProfile);
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="first-login-setup">
      <div className="setup-container">
        <div className="setup-header">
          <h1>🎓 Complete Your Profile</h1>
          <p>Welcome to ResolveIT! Please complete your academic information to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-section">
            <h3>Personal Information</h3>

            <div className="form-group">
              <label>Student ID *</label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="Enter your student ID"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your current address"
                rows="3"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Academic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Academic Year *</label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2022-2023">2022-2023</option>
                </select>
              </div>

              <div className="form-group">
                <label>Program *</label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  {programs.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Current Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
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
                  value={formData.gpa}
                  onChange={handleChange}
                  placeholder="Enter your GPA (0-10)"
                  required
                  disabled={isLoading}
                  className={gpaError ? 'error-input' : ''}
                />
                {gpaError && <p className="error-text">{gpaError}</p>}
                <small className="input-hint">
                  Enter your current GPA on a scale of 0 to 10 (e.g., 8.5, 7.2, 9.0)
                </small>
              </div>
            </div>

            <div className="form-group">
              <label>Department *</label>
              {isLoading ? (
                <select disabled>
                  <option>Loading departments...</option>
                </select>
              ) : (
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  required
                  disabled={departments.length === 0 || isLoading}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName} ({dept.departmentCode})
                    </option>
                  ))}
                </select>
              )}
              {departments.length === 0 && !isLoading && (
                <p className="error-text">No departments available. Please contact admin.</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading || departments.length === 0 || gpaError}
            >
              {isLoading ? '🔄 Saving...' : 'Complete Registration & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstLoginSetup;