import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ResumeEditor from './components/ResumeEditor';
import InterviewJournal from './components/InterviewJournal';
import { Application, Resume, ItemType } from './components/types';
import { db } from './utils/db';

const App: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [items, setItems] = useState<Record<ItemType, any[]>>({
    projects: [],
    skills: [],
    education: [],
    'certificates & awards': [],
    bootcamps: [],
    volunteering: [],
    'experience': [],
    coursework: [],
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resume' | 'journal'>('dashboard');
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  // Initialize DB and load data
  useEffect(() => {
    const initDb = async () => {
      try {
        await db.init();
        const [loadedApps, loadedResumes, loadedItems] = await Promise.all([
          db.getApplications(),
          db.getResumes(),
          db.getItems(),
        ]);
        setApplications(loadedApps);
        setResumes(loadedResumes);
        setItems(loadedItems);
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize DB:', error);
      }
    };
    initDb();
  }, []);

  // Save Applications
  useEffect(() => {
    if (isDbInitialized) {
      applications.forEach(app => db.saveApplication(app));
    }
  }, [applications, isDbInitialized]);

  // Save Resumes
  useEffect(() => {
    if (isDbInitialized) {
      resumes.forEach(resume => db.saveResume(resume));
    }
  }, [resumes, isDbInitialized]);

  // Save Items
  useEffect(() => {
    if (isDbInitialized) {
      Object.entries(items).forEach(([type, typeItems]) => {
        db.saveItems(type as ItemType, typeItems);
      });
    }
  }, [items, isDbInitialized]);

  const NavItem = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === id
        ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-indigo-600">
            <span className="text-2xl">💼</span>
            <h1 className="text-xl font-bold tracking-tight">Job Manager</h1>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <NavItem id="dashboard" label="Dashboard" icon="📊" />
          <NavItem id="resume" label="Resume Editor" icon="📝" />
          <NavItem id="journal" label="Interview Journal" icon="📓" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center space-x-2 text-sm text-indigo-700">
              <span className={`w-2 h-2 rounded-full ${isDbInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{isDbInitialized ? 'Data Synced' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="p-8 max-w-7xl mx-auto">
            <Dashboard
              applications={applications}
              setApplications={setApplications}
              resumes={resumes}
            />
          </div>
        )}
        {activeTab === 'resume' && (
          <div className="h-full">
            <ResumeEditor
              resumes={resumes}
              setResumes={setResumes}
              items={items}
              setItems={setItems}
            />
          </div>
        )}
        {activeTab === 'journal' && (
          <div className="p-8 max-w-5xl mx-auto">
            <InterviewJournal applications={applications} setApplications={setApplications} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;