import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import ResumeEditor from './ResumeEditor';
import InterviewJournal from './InterviewJournal';
import LoginScreen from './LoginScreen';
import InterviewPrep from './InterviewPrep';
import Settings from './Settings';
import { Application, Resume, ItemType, PrepQuestion } from './types';
import { db } from '../utils/db';

const JobWizard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [applications, setApplications] = useState<Application[]>([]);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [questions, setQuestions] = useState<PrepQuestion[]>([]);
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'resume' | 'journal' | 'prep' | 'settings'>('dashboard');
    const [isDbInitialized, setIsDbInitialized] = useState(false);

    const loadData = async () => {
        try {
            const [loadedApps, loadedResumes, loadedItems, loadedQuestions] = await Promise.all([
                db.getApplications(),
                db.getResumes(),
                db.getItems(),
                db.getPrepQuestions(),
            ]);
            // Data migration for questions (string -> string[]) and sources (string -> string[])
            const migratedQuestions = loadedQuestions.map((q: any) => {
                const update: any = { ...q };
                if (!q.questions) {
                    update.questions = q.question ? [q.question] : [];
                }
                if (!q.sources && q.source) {
                    update.sources = [q.source];
                } else if (!q.sources) {
                    update.sources = [];
                }
                return update as PrepQuestion;
            });

            setApplications(loadedApps);
            setResumes(loadedResumes);
            setItems(loadedItems);
            setQuestions(migratedQuestions);
            setIsDbInitialized(true);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    // Save Applications
    useEffect(() => {
        if (isDbInitialized && isAuthenticated) {
            applications.forEach(app => db.saveApplication(app));
        }
    }, [applications, isDbInitialized, isAuthenticated]);

    // Save Resumes
    useEffect(() => {
        if (isDbInitialized && isAuthenticated) {
            resumes.forEach(resume => db.saveResume(resume));
        }
    }, [resumes, isDbInitialized, isAuthenticated]);

    // Save Prep Questions (Not normally needed iteratively if we only alter via component, but good for sync consistency if architecture changes)
    // Actually, InterviewPrep component saves directly to DB on Save/Delete. 
    // But App state is source of truth for loading? 
    // No, InterviewPrep maintains its own local state which is initialized from App's passed prop?
    // Wait, In App.tsx I'm passing setQuestions. InterviewPrep calls db.save... AND setQuestions.
    // So I don't need a useEffect to auto-save `questions` here, unlike how ResumeEditor might rely on auto-save if it modifies deep objects?
    // ResumeEditor actually does db.save too. The useEffects here are a bit redundant/safety nets or for initial migrations.
    // I will skip adding a useEffect saver for questions since InterviewPrep handles it explicitly.

    // Save Items
    useEffect(() => {
        if (isDbInitialized && isAuthenticated) {
            Object.entries(items).forEach(([type, typeItems]) => {
                db.saveItems(type as ItemType, typeItems);
            });
        }
    }, [items, isDbInitialized, isAuthenticated]);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        loadData();
    };

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

    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

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
                    <NavItem id="prep" label="Interview Prep" icon="🧠" />
                    <NavItem id="settings" label="Settings" icon="⚙️" />
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
                {activeTab === 'prep' && (
                    <div className="p-8 max-w-5xl mx-auto">
                        <InterviewPrep questions={questions} setQuestions={setQuestions} />
                    </div>
                )}
                {activeTab === 'settings' && (
                    <div className="h-full">
                        <Settings applications={applications} resumes={resumes} items={items} questions={questions} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default JobWizard;