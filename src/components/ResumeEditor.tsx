import React, { useState } from 'react';
import { Resume, ItemType } from './types';

interface ResumeEditorProps {
  resumes: Resume[];
  setResumes: React.Dispatch<React.SetStateAction<Resume[]>>;
  items: Record<ItemType, any[]>;
  setItems: React.Dispatch<React.SetStateAction<Record<ItemType, any[]>>>;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumes, setResumes, items, setItems }) => {
  const [newResume, setNewResume] = useState({ name: '', content: '', tags: '' });
  const [selectedResume, setSelectedResume] = useState<string>('');

  const addResume = () => {
    const resume: Resume = {
      id: crypto.randomUUID(),
      name: newResume.name,
      content: newResume.content,
      tags: newResume.tags.split(',').map(tag => tag.trim()),
    };
    setResumes([...resumes, resume]);
    setNewResume({ name: '', content: '', tags: '' });
  };

  const addItem = (type: ItemType, content: string) => {
    setItems({
      ...items,
      [type]: [...items[type], { id: crypto.randomUUID(), content }],
    });
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Resume Editor</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Resume Name"
          value={newResume.name}
          onChange={(e) => setNewResume({ ...newResume, name: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={newResume.tags}
          onChange={(e) => setNewResume({ ...newResume, tags: e.target.value })}
          className="border p-2 mr-2"
        />
        <textarea
          placeholder="Resume Content"
          value={newResume.content}
          onChange={(e) => setNewResume({ ...newResume, content: e.target.value })}
          className="border p-2 w-full"
        />
        <button onClick={addResume} className="bg-blue-500 text-white p-2 rounded mt-2">
          Add Resume
        </button>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Add Item to Resume</h3>
        {Object.keys(items).map(type => (
          <div key={type} className="my-2">
            <input
              type="text"
              placeholder={`Add ${type}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addItem(type as ItemType, e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="border p-2"
            />
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-semibold">Existing Resumes</h3>
        {resumes.map(resume => (
          <div key={resume.id} className="border p-2 my-2">
            <h4>{resume.name} ({resume.tags.join(', ')})</h4>
            <p>{resume.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeEditor;