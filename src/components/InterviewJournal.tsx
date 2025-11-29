import React, { useState } from 'react';
import { Application, JournalEntry } from './types';

interface InterviewJournalProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
}

const InterviewJournal: React.FC<InterviewJournalProps> = ({ applications, setApplications }) => {
  const [newEntry, setNewEntry] = useState({
    applicationId: '',
    content: '',
    questions: '',
    outcome: '',
  });

  const addJournalEntry = () => {
    if (!newEntry.applicationId || !newEntry.content) return;

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content: newEntry.content,
      questions: newEntry.questions.split(',').map(q => q.trim()).filter(q => q),
      outcome: newEntry.outcome,
    };
    setApplications(applications.map(app =>
      app.id === newEntry.applicationId
        ? { ...app, journalEntries: [...app.journalEntries, entry] }
        : app
    ));
    setNewEntry({ applicationId: '', content: '', questions: '', outcome: '' });
  };

  // Flatten entries for timeline view
  const allEntries = applications.flatMap(app =>
    app.journalEntries.map((entry: JournalEntry) => ({ ...entry, appCompany: app.company, appPosition: app.position }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Add Entry Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">New Entry</h2>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                placeholder="What happened during the interview?"
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Questions Asked</label>
              <input
                type="text"
                placeholder="Comma-separated questions"
                value={newEntry.questions}
                onChange={(e) => setNewEntry({ ...newEntry, questions: e.target.value })}
                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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

            <button
              onClick={addJournalEntry}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition-colors"
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Timeline */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Journal Timeline</h2>

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
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800">{entry.appCompany}</h3>
                      <p className="text-xs text-slate-500">{entry.appPosition}</p>
                    </div>
                    <time className="text-xs font-medium text-indigo-500">{new Date(entry.date).toLocaleDateString()}</time>
                  </div>

                  <p className="text-slate-600 text-sm mb-3">{entry.content}</p>

                  {entry.questions.length > 0 && (
                    <div className="mb-3 bg-slate-50 p-2 rounded text-xs">
                      <span className="font-semibold text-slate-700 block mb-1">Questions:</span>
                      <ul className="list-disc list-inside text-slate-600">
                        {entry.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                      </ul>
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