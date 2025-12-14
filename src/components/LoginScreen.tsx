import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { deriveKey } from '../utils/cryptoUtils';

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [isSetup, setIsSetup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        checkSetup();
    }, []);

    const checkSetup = async () => {
        try {
            await db.init();
            const salt = await db.getSalt();
            if (!salt) {
                setIsSetup(true); // Need to setup
            } else {
                setIsSetup(false); // Already setup
            }
            setIsLoading(false);
        } catch (err) {
            console.error('DB Init error:', err);
            setError('Failed to initialize database');
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            setError('');
            if (isSetup) {
                // First time setup
                const salt = window.crypto.getRandomValues(new Uint8Array(16));
                const key = await deriveKey(password, salt);
                await db.setSalt(salt);
                db.setKey(key);
                // Check for migration? For now, we assume clean slate or user handles it.
                // Actually, if we have existing data, we should encrypt it now?
                // But the previous db.ts implementation might have left data.
                onLoginSuccess();
            } else {
                // Login
                const salt = await db.getSalt();
                if (!salt) {
                    setError('Error reading security data. Please reset.');
                    return;
                }
                const key = await deriveKey(password, salt);
                db.setKey(key);

                // Verify key by trying to read something (e.g. apps).
                // If decryption fails, it usually throws or returns garbage.
                // PBKDF2 doesn't verify password itself, we need to check MAC or attempt decrypt.
                try {
                    // Attempt to read applications (returns empty array if empty, fails if decryption error)
                    await db.getApplications();
                    onLoginSuccess();
                } catch (e) {
                    console.error(e);
                    setError('Incorrect password or data corruption.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred.');
        }
    };

    const handleReset = async () => {
        if (!showResetConfirm) {
            setShowResetConfirm(true);
            return;
        }
        await db.clearDatabase();
        window.location.reload();
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50">Loading...</div>;

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-slate-200">
                <div className="text-center mb-6">
                    <span className="text-4xl">🔐</span>
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">
                        {isSetup ? 'Set Encryption Password' : 'Unlock Database'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {isSetup
                            ? 'Create a password to encrypt your local data. Do not forget it!'
                            : 'Enter your password to decrypt your data.'}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <button
                        onClick={handleLogin}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded font-medium transition-colors"
                    >
                        {isSetup ? 'Set Password & Start' : 'Unlock'}
                    </button>

                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                        <button
                            onClick={handleReset}
                            className={`text-sm ${showResetConfirm ? 'text-red-600 font-bold bg-red-50 p-2 rounded' : 'text-slate-400 hover:text-red-500'}`}
                        >
                            {showResetConfirm ? 'Confirm Reset (Deletes ALL Data)' : 'Reset Password & Clear Data'}
                        </button>
                    </div>
                    {showResetConfirm && (
                        <p className="text-xs text-red-500 text-center mt-1">
                            This will permanently delete all stored resumes and applications. There is no undo.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
