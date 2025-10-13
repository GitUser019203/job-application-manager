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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Job Application Manager</h1>
      </header>
      <main className="container mx-auto p-4">
        <Dashboard
          applications={applications}
          setApplications={setApplications}
          resumes={resumes}
        />
        <ResumeEditor
          resumes={resumes}
          setResumes={setResumes}
          items={items}
          setItems={setItems}
        />
        <InterviewJournal applications={applications} setApplications={setApplications} />
      </main>
    </div>
  );
};

export default App;