import React, { useState } from 'react';
import { Application, Resume } from './types';
import { db } from '../utils/db';
import Preview from './MarkdownPreview';

interface DashboardProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  resumes: Resume[];
}

const Dashboard: React.FC<DashboardProps> = ({ applications, setApplications, resumes }) => {
  const [filter, setFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [newApplication, setNewApplication] = useState({
    company: '',
    position: '',
    resumeId: '',
    jobUrl: '',
    jobDescription: '',
    coverLetter: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const startEditing = (app: Application) => {
    setNewApplication({
      company: app.company,
      position: app.position,
      resumeId: app.resumeId || '',
      jobUrl: app.jobUrl || '',
      jobDescription: app.jobDescription || '',
      coverLetter: app.coverLetter || '',
      date: new Date(app.submissionDate).toISOString().split('T')[0],
    });
    setEditingId(app.id);
    setIsAdding(true);
  };

  const saveApplication = async () => {
    if (!newApplication.company || !newApplication.position) return;

    if (editingId) {
      // Update existing
      const updatedApp = applications.find(a => a.id === editingId);
      if (!updatedApp) return;

      const finalApp: Application = {
        ...updatedApp,
        company: newApplication.company,
        position: newApplication.position,
        resumeId: newApplication.resumeId,
        jobUrl: newApplication.jobUrl,
        jobDescription: newApplication.jobDescription,
        coverLetter: newApplication.coverLetter,
        submissionDate: new Date(newApplication.date + 'T12:00:00').toISOString(),
      };

      try {
        await db.saveApplication(finalApp);
        setApplications(applications.map(a => a.id === editingId ? finalApp : a));
      } catch (err) {
        console.error("Failed to update app", err);
        alert("Failed to update application");
      }
    } else {
      // Create new
      const newApp: Application = {
        id: crypto.randomUUID(),
        company: newApplication.company,
        position: newApplication.position,
        status: 'Submitted',
        submissionDate: new Date(newApplication.date + 'T12:00:00').toISOString(),
        resumeId: newApplication.resumeId,
        notes: [],
        journalEntries: [],
        jobUrl: newApplication.jobUrl,
        jobDescription: newApplication.jobDescription,
        coverLetter: newApplication.coverLetter,
      };

      try {
        await db.saveApplication(newApp);
        setApplications([...applications, newApp]);
      } catch (err) {
        console.error("Failed to save new app", err);
        alert("Failed to save new application");
      }
    }

    setNewApplication({
      company: '',
      position: '',
      resumeId: '',
      jobUrl: '',
      jobDescription: '',
      coverLetter: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const updateStatus = async (id: string, status: Application['status']) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    const updated = { ...app, status };

    try {
      await db.saveApplication(updated);
      setApplications(applications.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await db.deleteApplication(id);
        setApplications(applications.filter(app => app.id !== id));
      } catch (error) {
        console.error('Failed to delete application:', error);
        alert('Failed to delete application');
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  const handleReview = async (app: Application) => {
    if (!geminiApiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const resume = resumes.find(r => r.id === app.resumeId);
    if (!resume) {
      alert('Resume not found');
      return;
    }

    setIsReviewing(true);
    setReviewResult(null);
    setShowReviewModal(true);

    try {
      const prompt = `
        You are an expert career coach. Please review the following job application materials and provide feedback.
        
        JOB DESCRIPTION:
        ${app.jobDescription}

        COVER LETTER:
        ${app.coverLetter}

        RESUME:
        ${resume.content || JSON.stringify(resume.sections)}

        Please analyze the alignment between the resume/cover letter and the job description. 
        Highlight strengths, identify gaps, and suggest specific improvements.
        Format your response in Markdown.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setReviewResult(text);
      } else {
        throw new Error('No content generated');
      }

    } catch (error: any) {
      console.error('Gemini API Error:', error);
      setReviewResult(`Error: ${error.message}. Please check your API key and try again.`);
    } finally {
      setIsReviewing(false);
    }
  };

  const sortedApplications = [...applications].sort((a, b) => {
    const dateA = new Date(a.submissionDate).getTime();
    const dateB = new Date(b.submissionDate).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const filteredApplications = filter === 'All'
    ? sortedApplications
    : sortedApplications.filter(app => app.status === filter);

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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${geminiApiKey
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {geminiApiKey ? '🔑 API Key Set' : '🔑 Set API Key'}
          </button>
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
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) {
              setEditingId(null);
              setNewApplication({
                company: '',
                position: '',
                resumeId: '',
                jobUrl: '',
                jobDescription: '',
                coverLetter: '',
                date: new Date().toISOString().split('T')[0]
              });
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          {isAdding ? 'Cancel' : '+ Add Application'}
        </button>
      </div>

      {/* Add/Edit Application Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 mb-8 animate-fade-in-down">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? 'Edit Application' : 'New Application'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                value={newApplication.company}
                onChange={(e) => setNewApplication({ ...newApplication, company: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. My favorite company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
              <input
                type="text"
                value={newApplication.position}
                onChange={(e) => setNewApplication({ ...newApplication, position: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Frontend Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Applied</label>
              <input
                type="date"
                value={newApplication.date}
                onChange={(e) => setNewApplication({ ...newApplication, date: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Posting URL</label>
              <input
                type="url"
                value={newApplication.jobUrl}
                onChange={(e) => setNewApplication({ ...newApplication, jobUrl: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Resume Used</label>
              <select
                value={newApplication.resumeId}
                onChange={(e) => setNewApplication({ ...newApplication, resumeId: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Resume...</option>
                {resumes.map(resume => (
                  <option key={resume.id} value={resume.id}>
                    {resume.name} {resume.tags && resume.tags.length > 0 ? `(${resume.tags.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={newApplication.jobDescription}
                onChange={(e) => setNewApplication({ ...newApplication, jobDescription: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Paste job description here (Markdown supported)..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Letter</label>
              <textarea
                value={newApplication.coverLetter}
                onChange={(e) => setNewApplication({ ...newApplication, coverLetter: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Paste your cover letter here (Markdown supported)..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNewApplication({
                  company: '',
                  position: '',
                  resumeId: '',
                  jobUrl: '',
                  jobDescription: '',
                  coverLetter: '',
                  date: new Date().toISOString().split('T')[0]
                });
              }}
              className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveApplication}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              {editingId ? 'Update Application' : 'Save Application'}
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
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                  <button
                    onClick={() => startEditing(app)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="text-sm text-slate-500 mb-4 flex-1">
                <p>
                  Applied: {new Date(app.submissionDate).toLocaleDateString()}
                  <span className="ml-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const appliedDate = new Date(app.submissionDate);
                      appliedDate.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((today.getTime() - appliedDate.getTime()) / (1000 * 3600 * 24));
                      if (diffDays === 0) return 'Today';
                      if (diffDays === 1) return 'Yesterday';
                      if (diffDays < 0) return 'Future';
                      return `${diffDays} days ago`;
                    })()}
                  </span>
                </p>
                {app.resumeId && (
                  <p className="mt-1 text-xs">
                    Resume: {resumes.find(r => r.id === app.resumeId)?.name || 'Unknown'}
                  </p>
                )}
                {app.jobUrl && (
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs mt-1 block truncate">
                    Job Link ↗
                  </a>
                )}
              </div>

              {/* Expandable Details */}
              {(app.jobDescription || app.coverLetter) && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={() => toggleExpand(app.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none"
                    >
                      {expandedAppId === app.id ? 'Hide Details' : 'View Details'}
                    </button>

                    {app.resumeId && app.jobDescription && app.coverLetter && (
                      <button
                        onClick={() => handleReview(app)}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                      >
                        ✨ Review with Gemini
                      </button>
                    )}
                  </div>

                  {expandedAppId === app.id && (
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      {app.jobDescription && (
                        <div>
                          <strong className="block text-slate-700 mb-1">Job Description:</strong>
                          <div className="line-clamp-6 hover:line-clamp-none">
                            <Preview markdown={app.jobDescription} />
                          </div>
                        </div>
                      )}

                      {app.jobDescription && app.coverLetter && (
                        <hr className="my-3 border-slate-200" />
                      )}

                      {app.coverLetter && (
                        <div>
                          <strong className="block text-slate-700 mb-1">Cover Letter:</strong>
                          <div className="line-clamp-6 hover:line-clamp-none">
                            <Preview markdown={app.coverLetter} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 mt-auto flex justify-between items-center gap-4">
                <div className="flex-1">
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
                <div>
                  <label className="block text-xs font-medium text-transparent mb-1">Action</label>
                  <button
                    onClick={() => handleDeleteApplication(app.id)}
                    className="text-white bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors text-xs"
                    title="Delete Application"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Set Gemini API Key</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter your Google Gemini API key to enable AI features. The key is <strong>not saved</strong> and will be lost when you refresh the page.
            </p>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full border-slate-300 rounded-md mb-4 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter API Key..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save (Session Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Result Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                ✨ Gemini Application Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isReviewing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="text-slate-500 animate-pulse">Analyzing your application...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <Preview markdown={reviewResult || ''} />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowReviewModal(false)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;