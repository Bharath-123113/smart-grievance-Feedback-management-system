import React from 'react';

const QuickStats = ({ grievances }) => {
  const total = grievances.length;
  const submitted = grievances.filter(g => g.status === 'submitted').length;
  const inProgress = grievances.filter(g => g.status === 'in-progress' || g.status === 'under_review').length;
  const resolved = grievances.filter(g => g.status === 'resolved').length;
  const rejected = grievances.filter(g => g.status === 'rejected').length;

  const stats = [
    {
      label: 'Total Grievances',
      value: total,
      icon: '📋',
      color: '#4F46E5'
    },
    {
      label: 'Submitted',
      value: submitted,
      icon: '🟡',
      color: '#f59e0b'
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: '🔵',
      color: '#3b82f6'
    },
    {
      label: 'Resolved',
      value: resolved,
      icon: '🟢',
      color: '#10b981'
    }
  ];

  return (
    <div className="quick-stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon" style={{color: stat.color}}>
            {stat.icon}
          </div>
          <div className="stat-number" style={{color: stat.color}}>
            {stat.value}
          </div>
          <div className="stat-label">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;