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
  const [addingItemType, setAddingItemType] = useState<ItemType | null>(null);
  const [newItemContent, setNewItemContent] = useState('');

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

  const addItem = () => {
    if (addingItemType && newItemContent.trim()) {
      setItems({
        ...items,
        [addingItemType]: [...items[addingItemType], { id: crypto.randomUUID(), content: newItemContent }],
      });
      setNewItemContent('');
      setAddingItemType(null);
    }
  };

  const deleteItem = (type: ItemType, id: string) => {
    setItems({
      ...items,
      [type]: items[type].filter(item => item.id !== id),
    });
  };

  const insertItem = (content: string) => {
    if (editingResume && content) {
      updateEditingResume('content', editingResume.content + (editingResume.content ? '\n' : '') + content);
    }
  };

  const getPreviewContent = () => editingResume ? editingResume.content : (resumes.find(r => r.id === previewResumeId)?.content || '');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar: Resume List */}
      <div className="w-64 bg-white border-r p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Resumes</h2>
        <button
          onClick={() => startEditing()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded mb-4 transition-colors"
        >
          + New Resume
        </button>
        <div className="space-y-2">
          {resumes.map(resume => (
            <div
              key={resume.id}
              className={`p-3 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${editingResume?.id === resume.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
              onClick={() => startEditing(resume)}
            >
              <h4 className="font-semibold text-gray-800">{resume.name || 'Untitled'}</h4>
              <div className="text-xs text-gray-500 mt-1">
                {resume.tags.length > 0 ? resume.tags.join(', ') : 'No tags'}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewResumeId(resume.id); }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {editingResume ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{editingResume.isNew ? 'New Resume' : 'Edit Resume'}</h3>
              <div className="space-x-2">
                <button onClick={saveResume} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                  Save
                </button>
                <button onClick={() => setEditingResume(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
                  Close
                </button>
                <button onClick={() => setPreviewResumeId(editingResume.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                  Preview
                </button>
                <button onClick={() => saveToHTML(editingResume.content)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                  Export HTML
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Resume Name"
                value={editingResume.name}
                onChange={(e) => updateEditingResume('name', e.target.value)}
                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={typeof editingResume.tags === 'string' ? editingResume.tags : editingResume.tags.join(', ')}
                onChange={(e) => updateEditingResume('tags', e.target.value)}
                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              <textarea
                placeholder="Resume Content (Markdown)"
                value={editingResume.content}
                onChange={(e) => updateEditingResume('content', e.target.value)}
                className="border p-4 rounded resize-none focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              />
              <div className="border p-4 rounded overflow-auto bg-white">
                <MarkdownPreview markdown={editingResume.content} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a resume to edit or create a new one
          </div>
        )}
      </div>

      {/* Right Sidebar: Toolbox */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Toolbox</h2>
        <div className="space-y-6">
          {Object.keys(items).map(type => (
            <div key={type}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700 capitalize">{type}</h3>
                <button
                  onClick={() => setAddingItemType(type as ItemType)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
                >
                  + Add
                </button>
              </div>

              {addingItemType === type && (
                <div className="mb-3 p-3 bg-gray-50 rounded border border-blue-200">
                  <textarea
                    autoFocus
                    placeholder={`Enter new ${type}...`}
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    className="w-full border p-2 rounded mb-2 text-sm"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => { setAddingItemType(null); setNewItemContent(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addItem}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {items[type as ItemType].length === 0 ? (
                  <div className="text-sm text-gray-400 italic">No items yet</div>
                ) : (
                  items[type as ItemType].map(item => (
                    <div
                      key={item.id}
                      className="group relative p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded cursor-pointer transition-all"
                      onClick={() => insertItem(item.content)}
                      title="Click to insert"
                    >
                      <div className="text-sm text-gray-700 line-clamp-3">{item.content}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteItem(type as ItemType, item.id); }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                        title="Delete item"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {previewResumeId && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold">Resume Preview</h2>
            <button
              onClick={() => setPreviewResumeId(null)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
            <MarkdownPreview markdown={getPreviewContent()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;