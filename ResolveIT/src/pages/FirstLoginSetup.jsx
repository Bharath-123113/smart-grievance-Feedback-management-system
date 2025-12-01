import React, { useState } from 'react';
import './FirstLoginSetup.css';

const FirstLoginSetup = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    academic_year: '2024-2025',
    program: 'Bachelor of Technology',
    semester: '4',
    gpa: '3.75',
    department: 'Computer Science',
    phone: '',
    address: ''
  });

  const programs = [
    'Bachelor of Technology',
    'Bachelor of Science',
    'Bachelor of Arts',
    'Bachelor of Commerce',
    'Master of Technology',
    'Master of Science',
    'PhD'
  ];

  const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Business Administration'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const completeUserProfile = {
      ...user,
      ...formData,
      profile_completed: true,
      registration_date: new Date().toISOString(),
      member_since: new Date().toISOString(),
      account_status: 'Active'
    };

    onComplete(completeUserProfile);
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
                <select
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleChange}
                  required
                >
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
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Complete Registration & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstLoginSetup;