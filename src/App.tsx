import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ResumeEditor from './components/ResumeEditor';
import InterviewJournal from './components/InterviewJournal';
import { Application, Resume, ItemType } from './components/types';

const App: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [items, setItems] = useState<Record<ItemType, any[]>>({
    projects: [],
    skills: [],
    education: [],
    certificates: [],
    bootcamps: [],
    volunteering: [],
    workExperience: [],
    coursework: [],
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resume' | 'journal'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Job Application Manager</h1>
        <nav className="mt-4">
          <button
            className={`px-4 py-2 mr-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-800' : 'bg-blue-500'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 mr-2 rounded ${activeTab === 'resume' ? 'bg-blue-800' : 'bg-blue-500'}`}
            onClick={() => setActiveTab('resume')}
          >
            Resume Editor
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'journal' ? 'bg-blue-800' : 'bg-blue-500'}`}
            onClick={() => setActiveTab('journal')}
          >
            Interview Journal
          </button>
        </nav>
      </header>
      <main className="container mx-auto p-4">
        {activeTab === 'dashboard' && (
          <Dashboard
            applications={applications}
            setApplications={setApplications}
            resumes={resumes}
          />
        )}
        {activeTab === 'resume' && (
          <ResumeEditor
            resumes={resumes}
            setResumes={setResumes}
            items={items}
            setItems={setItems}
          />
        )}
        {activeTab === 'journal' && (
          <InterviewJournal applications={applications} setApplications={setApplications} />
        )}
      </main>
    </div>
  );
};

export default App;