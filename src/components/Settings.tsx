import React, { useState } from 'react';
import { db } from '../utils/db';
import { deriveKey } from '../utils/cryptoUtils';
import { Application, Resume, ItemType, PrepQuestion } from './types';

interface SettingsProps {
    applications: Application[];
    resumes: Resume[];
    items: Record<ItemType, any[]>;
    questions: PrepQuestion[];
}

const Settings: React.FC<SettingsProps> = ({ applications, resumes, items, questions }) => {
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
        link.download = `job-app-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
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

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Settings</h2>

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
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Import Data</h4>
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
                </div>
            </div>
        </div>
    );
};

export default Settings;
