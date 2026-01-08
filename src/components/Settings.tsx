import React, { useState } from 'react';
import { db } from '../utils/db';
import { deriveKey } from '../utils/cryptoUtils';
import { Application, Resume, ItemType, PrepQuestion } from './types';
import * as XLSX from 'xlsx';

interface SettingsProps {
    applications: Application[];
    setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
    resumes: Resume[];
    setResumes: React.Dispatch<React.SetStateAction<Resume[]>>;
    items: Record<ItemType, any[]>;
    setItems: React.Dispatch<React.SetStateAction<Record<ItemType, any[]>>>;
    questions: PrepQuestion[];
    setQuestions: React.Dispatch<React.SetStateAction<PrepQuestion[]>>;
}

const Settings: React.FC<SettingsProps> = ({
    applications, setApplications,
    resumes, setResumes,
    items, setItems,
    questions, setQuestions
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleChangePassword = async () => {
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!newPassword.trim()) {
            setError('Password cannot be empty');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Generate new salt and key
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const key = await deriveKey(newPassword, salt);

            // 3. Update DB security metadata
            await db.setSalt(salt);
            db.setKey(key);

            // 4. Re-save all content with new key
            const appPromises = applications.map(app => db.saveApplication(app));
            const resumePromises = resumes.map(res => db.saveResume(res));
            const itemPromises = Object.entries(items).map(([type, list]) => db.saveItems(type as ItemType, list));
            const questionPromises = questions.map(q => db.savePrepQuestion(q));

            await Promise.all([...appPromises, ...resumePromises, ...itemPromises, ...questionPromises]);

            setMessage('Password successfully changed and data re-encrypted!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Failed to change password:', err);
            setError('Failed to update password. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExport = () => {
        const data = {
            applications,
            resumes,
            items,
            questions,
            exportDate: new Date().toISOString()
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        link.download = `job-app-manager-backup-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm('Importing data will overwrite existing data with the same IDs. Are you sure?')) {
            return;
        }

        setIsProcessing(true);
        setMessage('');
        setError('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);

                if (!data.applications || !data.resumes || !data.items) {
                    throw new Error('Invalid backup file format');
                }

                // Import data
                const appPromises = data.applications.map((app: Application) => db.saveApplication(app));
                const resumePromises = data.resumes.map((res: Resume) => db.saveResume(res));
                const itemPromises = Object.entries(data.items).map(([type, list]) => db.saveItems(type as ItemType, list as any[]));
                const questionPromises = (data.questions || []).map((q: PrepQuestion) => db.savePrepQuestion(q));


                await Promise.all([...appPromises, ...resumePromises, ...itemPromises, ...questionPromises]);

                setMessage('Data imported successfully! Please refresh the page to see changes.');
                setTimeout(() => window.location.reload(), 1500);

            } catch (err) {
                console.error('Import failed', err);
                setError('Failed to import data: ' + (err as Error).message);
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setMessage('');
        setError('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const importedApps: Application[] = [];

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                    jsonData.forEach(row => {
                        // "Org", "Job", "Applied Date" are mandatory (or at least expected)
                        // "URL" is optional
                        const company = row['Org'];
                        const position = row['Job'];
                        const dateRaw = row['Applied Date'];
                        const jobUrl = row['URL'] || '';
                        const isRejected = row['Rejected'] === 'Yes';

                        if (company && position && dateRaw) {
                            let submissionDate: string;

                            // Handle Excel dates which can be numbers or strings
                            if (typeof dateRaw === 'number') {
                                // Excel base date is Dec 30, 1899
                                const date = new Date((dateRaw - 25569) * 86400 * 1000);
                                submissionDate = date.toISOString();
                            } else {
                                submissionDate = new Date(dateRaw).toISOString();
                                if (submissionDate === 'Invalid Date') {
                                    submissionDate = new Date().toISOString();
                                }
                            }

                            importedApps.push({
                                id: crypto.randomUUID(),
                                company: String(company),
                                position: String(position),
                                status: isRejected ? 'Rejected' : 'Submitted',
                                submissionDate,
                                resumeId: '', // unknown resume
                                notes: [],
                                journalEntries: [],
                                jobUrl: String(jobUrl),
                            });
                        }
                    });
                });

                if (importedApps.length === 0) {
                    throw new Error('No valid job applications found in Excel file. Ensure columns are named "Org", "Job", and "Applied Date".');
                }

                // Save to DB
                await Promise.all(importedApps.map(app => db.saveApplication(app)));

                // Update State
                setApplications(prev => [...prev, ...importedApps]);

                setMessage(`Successfully imported ${importedApps.length} applications from Excel!`);
            } catch (err) {
                console.error('Excel Import failed', err);
                setError('Failed to import Excel: ' + (err as Error).message);
            } finally {
                setIsProcessing(false);
                // Clear input
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-800 pl-10">Settings</h2>

            {/* Security Section */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Security</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Encryption Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Confirm new password"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {message && <p className="text-green-600 text-sm">{message}</p>}

                    <button
                        onClick={handleChangePassword}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors ${isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {isProcessing ? 'Processing...' : 'Change Password'}
                    </button>
                </div>
            </div>

            {/* Data Management Section */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Data Management</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Export Data</h4>
                        <p className="text-xs text-slate-500 mb-3">Download a backup of your data. This file is NOT encrypted and contains raw data.</p>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors border border-slate-300"
                        >
                            Download Backup
                        </button>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Import Data (JSON)</h4>
                        <p className="text-xs text-slate-500 mb-3">Restore data from a backup file. The imported data will be encrypted with your CURRENT password.</p>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100
                            "
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Import from Excel (.xlsx)</h4>
                        <p className="text-xs text-slate-500 mb-3">
                            Import job applications from Excel. Each sheet should have columns:
                            <span className="font-mono bg-slate-100 px-1 rounded mx-1 text-indigo-600">Org</span>,
                            <span className="font-mono bg-slate-100 px-1 rounded mx-1 text-indigo-600">Job</span>, and
                            <span className="font-mono bg-slate-100 px-1 rounded mx-1 text-indigo-600">Applied Date</span>.
                            Optional: <span className="font-mono bg-slate-100 px-1 rounded mx-1 text-indigo-600">URL</span>,
                            <span className="font-mono bg-slate-100 px-1 rounded mx-1 text-indigo-600">Rejected</span> (Yes/No).
                        </p>
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={handleExcelImport}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-green-50 file:text-green-700
                                hover:file:bg-green-100
                            "
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
