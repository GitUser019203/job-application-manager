import React, { useState } from 'react';
import { Application, Resume } from './types';

interface DashboardProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  resumes: Resume[];
}

const Dashboard: React.FC<DashboardProps> = ({ applications, setApplications, resumes }) => {
  const [filter, setFilter] = useState<string>('All');
  const [newApplication, setNewApplication] = useState({
    company: '',
    position: '',
    resumeId: '',
  });

  const addApplication = () => {
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
  };

  const updateStatus = (id: string, status: Application['status']) => {
    setApplications(applications.map(app =>
      app.id === id ? { ...app, status } : app
    ));
  };

  const filteredApplications = filter === 'All'
    ? applications
    : applications.filter(app => app.status === filter);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Application Tracker</h2>
      <div className="mb-4">
        <label className="mr-2">Filter by status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="All">All</option>
          <option value="Submitted">Submitted</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Rejected">Rejected</option>
          <option value="Offer Received">Offer Received</option>
        </select>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Company"
          value={newApplication.company}
          onChange={(e) => setNewApplication({ ...newApplication, company: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Position"
          value={newApplication.position}
          onChange={(e) => setNewApplication({ ...newApplication, position: e.target.value })}
          className="border p-2 mr-2"
        />
        <select
          value={newApplication.resumeId}
          onChange={(e) => setNewApplication({ ...newApplication, resumeId: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="">Select Resume</option>
          {resumes.map(resume => (
            <option key={resume.id} value={resume.id}>{resume.name}</option>
          ))}
        </select>
        <button onClick={addApplication} className="bg-blue-500 text-white p-2 rounded">
          Add Application
        </button>
      </div>
      <div className="grid gap-4">
        {filteredApplications.map(app => (
          <div key={app.id} className="border p-4 rounded">
            <h3 className="font-semibold">{app.company} - {app.position}</h3>
            <p>Status: {app.status}</p>
            <p>Submitted: {new Date(app.submissionDate).toLocaleDateString()}</p>
            <select
              value={app.status}
              onChange={(e) => updateStatus(app.id, e.target.value as Application['status'])}
              className="border p-1"
            >
              <option value="Submitted">Submitted</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer Received">Offer Received</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;