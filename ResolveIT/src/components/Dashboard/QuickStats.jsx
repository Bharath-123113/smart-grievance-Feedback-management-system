import React from 'react';
import './QuickStats.css';

const QuickStats = ({ stats, grievances = [] }) => {
  // Use backend stats if provided, otherwise calculate from grievances
  const displayStats = stats || {
    totalGrievances: grievances.length,
    submittedGrievances: grievances.filter(g => g.status === 'submitted').length,
    inProgressGrievances: grievances.filter(g => g.status === 'in_progress' || g.status === 'under_review').length,
    resolvedGrievances: grievances.filter(g => g.status === 'resolved').length,
    rejectedGrievances: grievances.filter(g => g.status === 'rejected').length
  };

  const statCards = [
    {
      title: 'Total Grievances',
      value: displayStats.totalGrievances || 0,
      color: 'blue',
      icon: '📋'
    },
    {
      title: 'Submitted',
      value: displayStats.submittedGrievances || 0,
      color: 'yellow',
      icon: '⏳'
    },
    {
      title: 'In Progress',
      value: displayStats.inProgressGrievances || 0,
      color: 'orange',
      icon: '🔧'
    },
    {
      title: 'Resolved',
      value: displayStats.resolvedGrievances || 0,
      color: 'green',
      icon: '✅'
    },
    {
      title: 'Rejected',
      value: displayStats.rejectedGrievances || 0,
      color: 'red',
      icon: '❌'
    }
  ];

  return (
    <div className="quick-stats">
      {statCards.map((stat, index) => (
        <div key={index} className={`stat-card ${stat.color}`}>
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-content">
            <h3>{stat.value}</h3>
            <p>{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;