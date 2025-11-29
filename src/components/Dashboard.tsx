import React, { useState } from 'react';
import { Application, Resume } from './types';

interface DashboardProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  resumes: Resume[];
}

const Dashboard: React.FC<DashboardProps> = ({ applications, setApplications, resumes }) => {
  const [filter, setFilter] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newApplication, setNewApplication] = useState({
    company: '',
    position: '',
    resumeId: '',
  });

  const addApplication = () => {
    if (!newApplication.company || !newApplication.position) return;

    const newApp: Application = {
      id: crypto.randomUUID(),
      company: newApplication.company,
      position: newApplication.position,
      status: 'Submitted',
      submissionDate: new Date().toISOString(),
      resumeId: newApplication.resumeId,
      notes: [],
      journalEntries: [],
    };
    setApplications([...applications, newApp]);
    setNewApplication({ company: '', position: '', resumeId: '' });
    setIsAdding(false);
  };

  const updateStatus = (id: string, status: Application['status']) => {
    setApplications(applications.map(app =>
      app.id === id ? { ...app, status } : app
    ));
  };

  const filteredApplications = filter === 'All'
    ? applications
    : applications.filter(app => app.status === filter);

  const stats = {
    total: applications.length,
    interviewing: applications.filter(a => a.status === 'Interviewing').length,
    offers: applications.filter(a => a.status === 'Offer Received').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Interviewing': return 'bg-yellow-100 text-yellow-800';
      case 'Offer Received': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Track your job applications and progress</p>
        </div>
        <div className="flex space-x-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Total</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-yellow-600">{stats.interviewing}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Active</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Offers</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="All">All Applications</option>
            <option value="Submitted">Submitted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Rejected">Rejected</option>
            <option value="Offer Received">Offers</option>
          </select>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          {isAdding ? 'Cancel' : '+ Add Application'}
        </button>
      </div>

      {/* Add Application Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 mb-8 animate-fade-in-down">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">New Application</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={newApplication.company}
                onChange={(e) => setNewApplication({ ...newApplication, company: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. My favorite company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
              <input
                type="text"
                value={newApplication.position}
                onChange={(e) => setNewApplication({ ...newApplication, position: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Frontend Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resume Used</label>
              <select
                value={newApplication.resumeId}
                onChange={(e) => setNewApplication({ ...newApplication, resumeId: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Resume...</option>
                {resumes.map(resume => (
                  <option key={resume.id} value={resume.id}>{resume.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={addApplication}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Save Application
            </button>
          </div>
        </div>
      )}

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500">No applications found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map(app => (
            <div key={app.id} className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{app.company}</h3>
                  <p className="text-slate-600 font-medium">{app.position}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>

              <div className="text-sm text-slate-500 mb-4 flex-1">
                <p>Applied: {new Date(app.submissionDate).toLocaleDateString()}</p>
                {app.resumeId && (
                  <p className="mt-1 text-xs">
                    Resume: {resumes.find(r => r.id === app.resumeId)?.name || 'Unknown'}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-auto">
                <label className="block text-xs font-medium text-slate-500 mb-1">Update Status</label>
                <select
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value as Application['status'])}
                  className="w-full border-slate-200 rounded text-sm py-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Offer Received">Offer Received</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;