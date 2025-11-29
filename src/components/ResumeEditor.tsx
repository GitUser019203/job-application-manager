import React, { useState, useEffect } from 'react';
import { Resume, ItemType } from './types';
import MarkdownPreview from './MarkdownPreview';
import { saveToHTML } from '../utils/htmlUtils';
import { parseResumeContent, compileResumeContent } from '../utils/resumeUtils';

interface ResumeEditorProps {
  resumes: Resume[];
  setResumes: React.Dispatch<React.SetStateAction<Resume[]>>;
  items: Record<ItemType, any[]>;
  setItems: React.Dispatch<React.SetStateAction<Record<ItemType, any[]>>>;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumes, setResumes, items, setItems }) => {
  const [editingResume, setEditingResume] = useState<Resume & { isNew?: boolean; sections?: Record<string, string> } | null>(null);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const [addingItemType, setAddingItemType] = useState<ItemType | null>(null);
  const [newItemContent, setNewItemContent] = useState('');

  // Ensure editingResume has sections
  useEffect(() => {
    if (editingResume && !editingResume.sections) {
      const sections = parseResumeContent(editingResume.content || '');
      setEditingResume((prev: (Resume & { isNew?: boolean; sections?: Record<string, string> }) | null) => prev ? { ...prev, sections } : null);
    }
  }, [editingResume]);

  const startEditing = (resume?: Resume) => {
    if (resume) {
      // Parse content if sections are missing (migration)
      const sections = resume.sections || parseResumeContent(resume.content);
      setEditingResume({ ...resume, sections });
    } else {
      setEditingResume({
        id: crypto.randomUUID(),
        name: '',
        content: '',
        sections: { 'Header': '' },
        tags: [],
        isNew: true,
      });
    }
  };

  const updateEditingResume = (field: keyof Resume, value: any) => {
    setEditingResume((prev: (Resume & { isNew?: boolean; sections?: Record<string, string> }) | null) => prev ? { ...prev, [field]: value } : null);
  };

  const updateSection = (sectionTitle: string, value: string) => {
    if (editingResume && editingResume.sections) {
      const newSections = { ...editingResume.sections, [sectionTitle]: value };
      const newContent = compileResumeContent(newSections);
      setEditingResume((prev: (Resume & { isNew?: boolean; sections?: Record<string, string> }) | null) => prev ? { ...prev, sections: newSections, content: newContent } : null);
    }
  };

  const addSection = () => {
    const title = prompt('Enter new section title (e.g., Projects, Skills):');
    if (title && editingResume && editingResume.sections) {
      if (!editingResume.sections[title]) {
        updateSection(title, '');
      }
    }
  };

  const deleteSection = (sectionTitle: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm(`Are you sure you want to delete the "${sectionTitle}" section?`)) {
      if (editingResume && editingResume.sections) {
        const newSections = { ...editingResume.sections };
        delete newSections[sectionTitle];
        const newContent = compileResumeContent(newSections);
        setEditingResume((prev: (Resume & { isNew?: boolean; sections?: Record<string, string> }) | null) => prev ? { ...prev, sections: newSections, content: newContent } : null);
      }
    }
  };

  const saveResume = () => {
    if (editingResume) {
      const { isNew, ...resume } = editingResume;
      // Ensure content is synced with sections
      if (resume.sections) {
        resume.content = compileResumeContent(resume.sections);
      }

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

  const insertItem = (content: string, type: ItemType) => {
    if (!editingResume || !editingResume.sections) return;

    const headingMap: Record<ItemType, string> = {
      projects: 'Projects',
      skills: 'Skills',
      education: 'Education',
      'certificates & awards': 'Certificates & Awards',
      bootcamps: 'Bootcamps',
      volunteering: 'Volunteering',
      'experience': 'Experience',
      coursework: 'Coursework',
    };

    const sectionTitle = headingMap[type];
    const currentSectionContent = editingResume.sections[sectionTitle] || '';
    const newSectionContent = currentSectionContent ? `${currentSectionContent}\n\n${content}` : content;

    updateSection(sectionTitle, newSectionContent);
  };

  const getPreviewContent = () => {
    if (editingResume) {
      return editingResume.content || compileResumeContent(editingResume.sections || {});
    }
    const resume = resumes.find(r => r.id === previewResumeId);
    return resume ? (resume.content || compileResumeContent(resume.sections || {})) : '';
  };

  return (
    <div className="flex h-full bg-slate-50 border-t border-slate-200">
      {/* Left Sidebar: Resume List */}
      <div className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-lg font-bold mb-4 text-slate-800">Resumes</h2>
        <button
          onClick={() => startEditing()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded mb-4 transition-colors text-sm font-medium"
        >
          + New Resume
        </button>
        <div className="space-y-2">
          {resumes.map(resume => (
            <div
              key={resume.id}
              className={`p-3 rounded border cursor-pointer hover:bg-slate-50 transition-colors ${editingResume?.id === resume.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
              onClick={() => startEditing(resume)}
            >
              <h4 className="font-semibold text-slate-800 text-sm">{resume.name || 'Untitled'}</h4>
              <div className="text-xs text-slate-500 mt-1 truncate">
                {resume.tags.length > 0 ? resume.tags.join(', ') : 'No tags'}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewResumeId(resume.id); }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {editingResume ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{editingResume.isNew ? 'New Resume' : 'Edit Resume'}</h3>
              <div className="space-x-2 flex">
                <button onClick={saveResume} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors">
                  Save
                </button>
                <button onClick={() => setEditingResume(null)} className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm transition-colors">
                  Close
                </button>
                <button onClick={() => setPreviewResumeId(editingResume.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm transition-colors">
                  Preview
                </button>
                <button onClick={() => saveToHTML(editingResume.content)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm transition-colors">
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
                className="border-slate-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={typeof editingResume.tags === 'string' ? editingResume.tags : editingResume.tags.join(', ')}
                onChange={(e) => updateEditingResume('tags', e.target.value)}
                className="border-slate-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="flex-1 flex flex-row gap-4 min-h-0 overflow-hidden">
              {/* Sections Editor */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-700">Sections</h4>
                  <button onClick={addSection} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600">+ Add Section</button>
                </div>

                {editingResume.sections && Object.entries(editingResume.sections).map(([title, content]) => (
                  <div key={title} className="border border-slate-200 rounded p-3 bg-slate-50">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-semibold text-slate-700 text-sm">{title}</h5>
                      {title !== 'Header' && (
                        <button
                          onClick={() => deleteSection(title)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove section"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => updateSection(title, e.target.value)}
                      className="w-full border-slate-300 p-2 rounded text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      rows={5}
                    />
                  </div>
                ))}
              </div>

              {/* Live Preview */}
              <div className="flex-1 border border-slate-200 p-4 rounded overflow-auto bg-white shadow-inner">
                <MarkdownPreview markdown={editingResume.content} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <span className="text-4xl mb-4">📄</span>
            <p>Select a resume to edit or create a new one</p>
          </div>
        )}
      </div>

      {/* Right Sidebar: Toolbox */}
      <div className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-lg font-bold mb-4 text-slate-800">Toolbox</h2>
        <div className="space-y-6">
          {Object.keys(items).map(type => (
            <div key={type}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-700 capitalize text-sm">{type}</h3>
                <button
                  onClick={() => setAddingItemType(type as ItemType)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded"
                >
                  + Add
                </button>
              </div>

              {addingItemType === type && (
                <div className="mb-3 p-3 bg-slate-50 rounded border border-indigo-200">
                  <textarea
                    autoFocus
                    placeholder={`Enter new ${type}...`}
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    className="w-full border-slate-300 p-2 rounded mb-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => { setAddingItemType(null); setNewItemContent(''); }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addItem}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {items[type as ItemType].length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No items yet</div>
                ) : (
                  items[type as ItemType].map(item => (
                    <div
                      key={item.id}
                      className="group relative p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded cursor-pointer transition-all"
                      onClick={() => insertItem(item.content, type as ItemType)}
                      title="Click to insert"
                    >
                      <div className="text-xs text-slate-700 line-clamp-3">{item.content}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteItem(type as ItemType, item.id); }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1"
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
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Resume Preview</h2>
            <button
              onClick={() => setPreviewResumeId(null)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
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