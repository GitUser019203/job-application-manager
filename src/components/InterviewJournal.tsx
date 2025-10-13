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
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content: newEntry.content,
      questions: newEntry.questions.split(',').map(q => q.trim()),
      outcome: newEntry.outcome,
    };
    setApplications(applications.map(app =>
      app.id === newEntry.applicationId
        ? { ...app, journalEntries: [...app.journalEntries, entry] }
        : app
    ));
    setNewEntry({ applicationId: '', content: '', questions: '', outcome: '' });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Interview Journal</h2>
      <div className="mb-4">
        <select
          value={newEntry.applicationId}
          onChange={(e) => setNewEntry({ ...newEntry, applicationId: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="">Select Application</option>
          {applications.map(app => (
            <option key={app.id} value={app.id}>{app.company} - {app.position}</option>
          ))}
        </select>
        <textarea
          placeholder="Interview Notes"
          value={newEntry.content}
          onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Questions Asked (comma-separated)"
          value={newEntry.questions}
          onChange={(e) => setNewEntry({ ...newEntry, questions: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Outcome"
          value={newEntry.outcome}
          onChange={(e) => setNewEntry({ ...newEntry, outcome: e.target.value })}
          className="border p-2 w-full"
        />
        <button onClick={addJournalEntry} className="bg-blue-500 text-white p-2 rounded mt-2">
          Add Journal Entry
        </button>
      </div>
      <div>
        {applications.map(app => (
          app.journalEntries.length > 0 && (
            <div key={app.id} className="border p-4 my-2">
              <h3 className="font-semibold">{app.company} - {app.position}</h3>
              {app.journalEntries.map(entry => (
                <div key={entry.id} className="my-2">
                  <p>Date: {new Date(entry.date).toLocaleDateString()}</p>
                  <p>Notes: {entry.content}</p>
                  <p>Questions: {entry.questions.join(', ')}</p>
                  <p>Outcome: {entry.outcome}</p>
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default InterviewJournal;