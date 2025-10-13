import React, { useState } from 'react';
import { Resume, ItemType } from './types';
import MarkdownPreview from './MarkdownPreview';
import { saveToHTML } from '../utils/htmlUtils';
import resumeText from './DemoMarkdown';

interface ResumeEditorProps {
  resumes: Resume[];
  setResumes: React.Dispatch<React.SetStateAction<Resume[]>>;
  items: Record<ItemType, any[]>;
  setItems: React.Dispatch<React.SetStateAction<Record<ItemType, any[]>>>;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumes, setResumes, items, setItems }) => {
  const [editingResume, setEditingResume] = useState<Resume & { isNew?: boolean } | null>(null);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  

  const startEditing = (resume?: Resume) => {
    if (resume) {
      setEditingResume({ ...resume });
    } else {
      setEditingResume({
        id: crypto.randomUUID(),
        name: '',
        content: '',
        tags: [],
        isNew: true,
      });
    }
  };

  const updateEditingResume = (field: keyof Resume, value: any) => {
    setEditingResume(prev => prev ? { ...prev, [field]: value } : null);
  };

  const saveResume = () => {
    if (editingResume) {
      const { isNew, ...resume } = editingResume;
      // normalize tags to string[]
      const rawTags = (resume as any).tags;
      if (typeof rawTags === 'string') {
        resume.tags = rawTags.split(',').map((tag: string) => tag.trim());
      } else if (Array.isArray(rawTags)) {
        resume.tags = rawTags;
      } else {
        resume.tags = [];
      }
      if (isNew) {
        setResumes([...resumes, resume]);
      } else {
        setResumes(resumes.map(r => r.id === resume.id ? resume : r));
      }
      setEditingResume(null);
    }
  };

  const addItem = (type: ItemType, content: string) => {
    if (content.trim()) {
      setItems({
        ...items,
        [type]: [...items[type], { id: crypto.randomUUID(), content }],
      });
    }
  };

  const insertItem = (content: string) => {
    if (editingResume && content) {
      updateEditingResume('content', editingResume.content + (editingResume.content ? '\n' : '') + content);
    }
  };

  const getPreviewContent = () =>  editingResume ? editingResume.content : (resumes.find(r => r.id === previewResumeId)?.content || '');

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Resume Editor</h2>
      <button onClick={() => startEditing()} className="bg-blue-500 text-white p-2 rounded mb-4">
        Add New Resume
      </button>
      {editingResume && (
        <div className="border p-4 mb-4 rounded">
          <h3 className="font-semibold mb-2">{editingResume.isNew ? 'New Resume' : 'Edit Resume'}</h3>
          <input
            type="text"
            placeholder="Resume Name"
            value={editingResume.name}
            onChange={(e) => updateEditingResume('name', e.target.value)}
            className="border p-2 mr-2 mb-2"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={typeof editingResume.tags === 'string' ? editingResume.tags : editingResume.tags.join(', ')}
            onChange={(e) => updateEditingResume('tags', e.target.value)}
            className="border p-2 mr-2 mb-2"
          />
          <div className="grid grid-cols-2 gap-4">
            <textarea
              placeholder="Resume Content (Markdown)"
              value={editingResume.content}
              onChange={(e) => updateEditingResume('content', e.target.value)}
              className="border p-2 h-96"
            />
            <div className="border p-2 h-96 overflow-auto">
              <MarkdownPreview markdown={editingResume?.content ? editingResume.content : resumeText} />
            </div>
          </div>
          <button onClick={saveResume} className="bg-green-500 text-white p-2 rounded mt-2 mr-2">
            Save
          </button>
          <button onClick={() => setEditingResume(null)} className="bg-red-500 text-white p-2 rounded mt-2 mr-2">
            Cancel
          </button>
          <button onClick={() => setPreviewResumeId(editingResume.id)} className="bg-blue-500 text-white p-2 rounded mt-2 mr-2">
            Preview Full Screen
          </button>
          <button onClick={() => saveToHTML(editingResume.content)} className="bg-purple-500 text-white p-2 rounded mt-2 mr-2">
            Save To HTML
          </button>
          <div className="mt-4">
            <h4 className="font-semibold">Insert Items</h4>
            {Object.keys(items).map(type => (
              <div key={type} className="my-2">
                <label className="block font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                <select
                  className="border p-2 w-full mb-1"
                  defaultValue=""
                  onChange={(e) => insertItem(e.target.value)}
                >
                  <option value="" disabled>Select existing {type}</option>
                  {items[type as ItemType].map(item => (
                    <option key={item.id} value={item.content}>
                      {item.content}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder={`Add new ${type}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim() && !e.shiftKey) {
                      addItem(type as ItemType, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="border p-2 w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="font-semibold mb-2">Existing Resumes</h3>
        {resumes.map(resume => (
          <div key={resume.id} className="border p-2 my-2 rounded">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{resume.name} ({resume.tags.join(', ')})</h4>
              <div>
                <button onClick={() => startEditing(resume)} className="bg-blue-500 text-white p-1 rounded mr-2">
                  Edit
                </button>
                <button onClick={() => setPreviewResumeId(resume.id)} className="bg-blue-500 text-white p-1 rounded">
                  Preview Full Screen
                </button>
              </div>
            </div>
            <div className="mt-2 h-40 overflow-auto">
              <MarkdownPreview markdown={resume.content} />
            </div>
          </div>
        ))}
      </div>
      {previewResumeId && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 p-4 overflow-auto">
          <button onClick={() => setPreviewResumeId(null)} className="bg-red-500 text-white p-2 rounded mb-4">
            Close Full Screen Preview
          </button>
          <MarkdownPreview markdown={getPreviewContent()} />
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;