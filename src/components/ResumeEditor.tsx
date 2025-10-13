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
  const [newItem, setNewItem] = useState<Record<ItemType, string>>({
    projects: '',
    skills: '',
    education: '',
    certificates: '',
    bootcamps: '',
    volunteering: '',
    workExperience: '',
    coursework: '',
  });

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
    if (content.trim()) {
      setItems({
        ...items,
        [type]: [...items[type], { id: crypto.randomUUID(), content }],
      });
      setNewItem({ ...newItem, [type]: '' });
    }
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
            <label className="block font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</label>
            <select
              className="border p-2 w-full mb-1"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  setNewResume({
                    ...newResume,
                    content: newResume.content + (newResume.content ? '\n' : '') + e.target.value,
                  });
                }
              }}
            >
              <option value="" disabled>Select existing {type}</option>
              {items[type as ItemType].map(item => (
                <option key={item.id} value={item.content}>
                  {item.content}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={`Add new ${type}`}
              value={newItem[type as ItemType]}
              onChange={(e) => setNewItem({ ...newItem, [type]: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newItem[type as ItemType].trim()) {
                  addItem(type as ItemType, newItem[type as ItemType]);
                }
              }}
              className="border p-2 w-full"
            />
            <button
              onClick={() => addItem(type as ItemType, newItem[type as ItemType])}
              className="bg-blue-500 text-white p-2 rounded mt-1"
              disabled={!newItem[type as ItemType].trim()}
            >
              Add {type}
            </button>
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