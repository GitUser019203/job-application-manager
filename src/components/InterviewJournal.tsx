import React, { useState } from 'react';
import { Application, JournalEntry } from './types';

import { db } from '../utils/db';

interface InterviewJournalProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
}

const InterviewJournal: React.FC<InterviewJournalProps> = ({ applications, setApplications }) => {
  const [newEntry, setNewEntry] = useState({
    applicationId: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    questions: '',
    outcome: '',
  });

  const [editingEntry, setEditingEntry] = useState<{ entryId: string, appId: string } | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const startEditing = (entry: any) => {
    setNewEntry({
      applicationId: entry.appId,
      date: new Date(entry.date).toISOString().split('T')[0],
      content: entry.content,
      questions: entry.questions.join('\n'),
      outcome: entry.outcome || '',
    });
    setEditingEntry({ entryId: entry.id, appId: entry.appId });
  };

  const saveJournalEntry = async () => {
    if (!newEntry.applicationId || !newEntry.content) return;

    const entryDate = new Date(newEntry.date + 'T12:00:00').toISOString();
    // Split by new line, generic cleaning
    const questionsList = newEntry.questions
      .split('\n')
      .map(q => q.trim())
      .filter(q => q);

    if (editingEntry) {
      // Update existing
      const appIndex = applications.findIndex(a => a.id === editingEntry.appId);
      if (appIndex === -1) return;

      const updatedEntries = applications[appIndex].journalEntries.map(e => {
        if (e.id === editingEntry.entryId) {
          return {
            ...e,
            date: entryDate,
            content: newEntry.content,
            questions: questionsList,
            outcome: newEntry.outcome,
          };
        }
        return e;
      });

      // Logic if user CHANGED the application (move entry) could be complex, 
      // for simplicty, forbid changing application or handle as delete + add.
      // Here we assume application can change but we need to handle moving it.
      // Ideally we just update it in place if appId matches.

      if (newEntry.applicationId !== editingEntry.appId) {
        // Move entry to new app
        // 1. Remove from old
        const oldApp = applications[appIndex];
        const entryToMove = oldApp.journalEntries.find(e => e.id === editingEntry.entryId);
        if (!entryToMove) return;

        const updatedOldApp = {
          ...oldApp,
          journalEntries: oldApp.journalEntries.filter(e => e.id !== editingEntry.entryId)
        };

        // 2. Add to new
        const newAppIndex = applications.findIndex(a => a.id === newEntry.applicationId);
        if (newAppIndex === -1) return; // Should not happen

        const updatedNewEntry: JournalEntry = {
          ...entryToMove,
          date: entryDate,
          content: newEntry.content,
          questions: questionsList,
          outcome: newEntry.outcome,
        };

        const updatedNewApp = {
          ...applications[newAppIndex],
          journalEntries: [...applications[newAppIndex].journalEntries, updatedNewEntry]
        };

        try {
          await db.saveApplication(updatedOldApp);
          await db.saveApplication(updatedNewApp);

          const newApps = [...applications];
          newApps[appIndex] = updatedOldApp;
          newApps[newAppIndex] = updatedNewApp;
          setApplications(newApps);
        } catch (err) {
          console.error("Failed to move entry", err);
        }

      } else {
        // Same app, just update
        const updatedApp = {
          ...applications[appIndex],
          journalEntries: updatedEntries
        };

        try {
          await db.saveApplication(updatedApp);
          const newApps = [...applications];
          newApps[appIndex] = updatedApp;
          setApplications(newApps);
        } catch (err) {
          console.error('Failed to update journal entry', err);
          alert('Failed to update journal entry');
        }
      }
    } else {
      // Create new
      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date: entryDate,
        content: newEntry.content,
        questions: questionsList,
        outcome: newEntry.outcome,
      };

      // Find app and update
      const appIndex = applications.findIndex(a => a.id === newEntry.applicationId);
      if (appIndex === -1) return;

      const updatedApp = {
        ...applications[appIndex],
        journalEntries: [...applications[appIndex].journalEntries, entry]
      };

      try {
        await db.saveApplication(updatedApp);
        const newApps = [...applications];
        newApps[appIndex] = updatedApp;
        setApplications(newApps);
      } catch (err) {
        console.error('Failed to save journal entry', err);
        alert('Failed to save journal entry');
      }
    }

    setNewEntry({
      applicationId: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      questions: '',
      outcome: ''
    });
    setEditingEntry(null);
  };

  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

  const toggleExpandEntry = (id: string) => {
    const newSet = new Set(expandedEntryIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedEntryIds(newSet);
  };

  const [expandedQuestionEntryIds, setExpandedQuestionEntryIds] = useState<Set<string>>(new Set());

  const toggleExpandQuestions = (id: string) => {
    const newSet = new Set(expandedQuestionEntryIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedQuestionEntryIds(newSet);
  };

  const deleteJournalEntry = async (appId: string, entryId: string) => {
    if (!window.confirm('Delete this journal entry?')) return;

    const appIndex = applications.findIndex(a => a.id === appId);
    if (appIndex === -1) return;

    const updatedApp = {
      ...applications[appIndex],
      journalEntries: applications[appIndex].journalEntries.filter(e => e.id !== entryId)
    };

    try {
      await db.saveApplication(updatedApp);
      const newApps = [...applications];
      newApps[appIndex] = updatedApp;
      setApplications(newApps);
    } catch (err) {
      console.error('Failed to delete journal entry', err);
      alert('Failed to delete journal entry');
    }
  };

  // Flatten entries for timeline view
  const allEntries = applications.flatMap(app =>
    app.journalEntries.map((entry: JournalEntry) => ({ ...entry, appId: app.id, appCompany: app.company, appPosition: app.position }))
  ).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Add Entry Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{editingEntry ? 'Edit Entry' : 'New Entry'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Application</label>
              <select
                value={newEntry.applicationId}
                onChange={(e) => setNewEntry({ ...newEntry, applicationId: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Application...</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.company} - {app.position}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                placeholder="What happened during the interview?"
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Questions Asked (One per line)</label>
              <textarea
                placeholder="Question 1&#10;Question 2&#10;Question 3"
                value={newEntry.questions}
                onChange={(e) => setNewEntry({ ...newEntry, questions: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Outcome / Next Steps</label>
              <input
                type="text"
                placeholder="e.g. Passed to next round"
                value={newEntry.outcome}
                onChange={(e) => setNewEntry({ ...newEntry, outcome: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              {editingEntry && (
                <button
                  onClick={() => {
                    setEditingEntry(null);
                    setNewEntry({
                      applicationId: '',
                      date: new Date().toISOString().split('T')[0],
                      content: '',
                      questions: '',
                      outcome: ''
                    });
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={saveJournalEntry}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition-colors"
              >
                {editingEntry ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Timeline */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Journal Timeline</h2>
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
        </div>

        {allEntries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No journal entries yet.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {allEntries.map(entry => (
              <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <span className="text-indigo-600 text-sm">📝</span>
                </div>

                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group/card">
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(entry)}
                      className="text-slate-400 hover:text-indigo-600"
                      title="Edit Entry"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteJournalEntry(entry.appId, entry.id)}
                      className="text-slate-400 hover:text-red-500"
                      title="Delete Entry"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-2 pr-12">
                    <div>
                      <h3 className="font-bold text-slate-800">{entry.appCompany}</h3>
                      <p className="text-xs text-slate-500">{entry.appPosition}</p>
                    </div>
                    <time className="text-xs font-medium text-indigo-500">{new Date(entry.date).toLocaleDateString()}</time>
                  </div>

                  <div
                    className={`text-slate-600 text-sm mb-3 whitespace-pre-wrap transition-all cursor-pointer ${expandedEntryIds.has(entry.id) ? '' : 'line-clamp-3'}`}
                    onClick={() => toggleExpandEntry(entry.id)}
                    title={expandedEntryIds.has(entry.id) ? "Click to collapse" : "Click to expand"}
                  >
                    {entry.content}
                  </div>
                  {entry.content.length > 150 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpandEntry(entry.id); }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 mb-3 block focus:outline-none"
                    >
                      {expandedEntryIds.has(entry.id) ? 'Show Less' : 'Show More'}
                    </button>
                  )}

                  {entry.questions.length > 0 && (
                    <div className="mb-3 bg-slate-50 p-2 rounded text-xs">
                      <div
                        className="flex justify-between items-center cursor-pointer select-none"
                        onClick={(e) => { e.stopPropagation(); toggleExpandQuestions(entry.id); }}
                      >
                        <span className="font-semibold text-slate-700 block mb-1">Questions ({entry.questions.length})</span>
                        <span className="text-slate-500 text-[10px]">{expandedQuestionEntryIds.has(entry.id) ? '▼' : '▶'}</span>
                      </div>

                      {expandedQuestionEntryIds.has(entry.id) && (
                        <ul className="list-disc list-inside text-slate-600 mt-1">
                          {entry.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  {entry.outcome && (
                    <div className="text-xs font-medium text-slate-700 border-t border-slate-100 pt-2">
                      Outcome: <span className="text-indigo-600">{entry.outcome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewJournal;