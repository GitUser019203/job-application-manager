import React, { useState, useMemo, useEffect } from 'react';
import { PrepQuestion, PrepCategory } from './types';
import { db } from '../utils/db';

interface InterviewPrepProps {
    questions: PrepQuestion[];
    setQuestions: React.Dispatch<React.SetStateAction<PrepQuestion[]>>;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions, setQuestions }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<PrepCategory | 'All'>('All');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fullScreenQuestion, setFullScreenQuestion] = useState<PrepQuestion | null>(null);

    const [newQuestion, setNewQuestion] = useState<{
        questions: string;
        answer: string;
        category: PrepCategory;
        sources: string;
    }>({
        questions: '',
        answer: '',
        category: 'Behavioral',
        sources: '',
    });

    const categories: PrepCategory[] = ['STAR', 'Behavioral', 'Technical'];

    // Close full-screen on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && fullScreenQuestion) {
                setFullScreenQuestion(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [fullScreenQuestion]);

    const handleSave = async () => {
        if (!newQuestion.questions.trim() || !newQuestion.answer.trim()) return;

        const questionsArray = newQuestion.questions.split('\n').filter(q => q.trim().length > 0);
        const sourcesArray = newQuestion.sources.split('\n').filter(s => s.trim().length > 0);

        try {
            if (editingId) {
                const existing = questions.find(q => q.id === editingId);
                if (existing) {
                    const updated: PrepQuestion = {
                        ...existing,
                        questions: questionsArray,
                        answer: newQuestion.answer,
                        category: newQuestion.category,
                        sources: sourcesArray,
                    };
                    await db.savePrepQuestion(updated);
                    setQuestions(questions.map(q => q.id === editingId ? updated : q));
                }
            } else {
                const newQ: PrepQuestion = {
                    id: crypto.randomUUID(),
                    dateAdded: new Date().toISOString(),
                    ...newQuestion,
                    questions: questionsArray,
                    sources: sourcesArray,
                };
                await db.savePrepQuestion(newQ);
                setQuestions([...questions, newQ]);
            }

            setNewQuestion({ questions: '', answer: '', category: 'Behavioral', sources: '' });
            setEditingId(null);
        } catch (err) {
            console.error('Failed to save question', err);
            alert('Failed to save question');
        }
    };

    const handleEdit = (q: PrepQuestion) => {
        setNewQuestion({
            questions: q.questions.join('\n'),
            answer: q.answer,
            category: q.category,
            sources: (q.sources || []).join('\n'),
        });
        setEditingId(q.id);
        setFullScreenQuestion(null); // Close full-screen if open
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this question?')) {
            try {
                await db.deletePrepQuestion(id);
                setQuestions(questions.filter(q => q.id !== id));
                if (editingId === id) {
                    setEditingId(null);
                    setNewQuestion({ questions: '', answer: '', category: 'Behavioral', sources: '' });
                }
                if (fullScreenQuestion?.id === id) {
                    setFullScreenQuestion(null);
                }
            } catch (err) {
                console.error('Failed to delete question', err);
                alert('Failed to delete question');
            }
        }
    };

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const matchesSearch = q.questions.some(qn => qn.toLowerCase().includes(searchQuery.toLowerCase())) ||
                q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (q.sources && q.sources.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
            const matchesCategory = filterCategory === 'All' || q.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [questions, searchQuery, filterCategory]);

    const getCategoryStyles = (category: PrepCategory) => {
        switch (category) {
            case 'STAR': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Behavioral': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Technical': return 'bg-purple-100 text-purple-700 border-purple-200';
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Question' : 'Add Question'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <div className="flex gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewQuestion({ ...newQuestion, category: cat })}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${newQuestion.category === cat
                                                ? getCategoryStyles(cat)
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Questions (One per line)</label>
                                <textarea
                                    value={newQuestion.questions}
                                    onChange={e => setNewQuestion({ ...newQuestion, questions: e.target.value })}
                                    placeholder="What is your interview question?"
                                    className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Answer / Key Points</label>
                                <textarea
                                    value={newQuestion.answer}
                                    onChange={e => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                                    placeholder="Structure your answer..."
                                    className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sources / Interview Context (One per line)</label>
                                <textarea
                                    value={newQuestion.sources}
                                    onChange={e => setNewQuestion({ ...newQuestion, sources: e.target.value })}
                                    placeholder="Where did you see that question?"
                                    className="w-full border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                {editingId && (
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setNewQuestion({ questions: '', answer: '', category: 'Behavioral', sources: '' });
                                        }}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={!newQuestion.questions.trim()}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingId ? 'Update Question' : 'Add Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Question Bank ({filteredQuestions.length})</h2>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value as any)}
                                className="border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="All">All Categories</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 sm:w-64"
                            />
                        </div>
                    </div>

                    {filteredQuestions.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                            <p className="text-slate-500">No questions found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredQuestions.map(q => (
                                <div
                                    key={q.id}
                                    className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
                                    onClick={() => setFullScreenQuestion(q)}
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setFullScreenQuestion(q); }} className="text-slate-400 hover:text-indigo-600 p-1" title="View Full">🔍</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(q); }} className="text-slate-400 hover:text-indigo-600 p-1" title="Edit">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} className="text-slate-400 hover:text-red-500 p-1" title="Delete">×</button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${getCategoryStyles(q.category)}`}>
                                            {q.category}
                                        </span>
                                        {q.sources && q.sources.map((source, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {source}
                                            </span>
                                        ))}
                                        <span className="text-xs text-slate-400">Added {new Date(q.dateAdded).toLocaleDateString()}</span>
                                    </div>

                                    <div className="mb-3 pr-16 space-y-2">
                                        {q.questions.map((qn, idx) => (
                                            <div key={idx} className="font-semibold text-slate-800 text-lg flex items-start gap-2">
                                                {q.questions.length > 1 && <span className="text-slate-400 text-sm mt-1">•</span>}
                                                <span>{qn}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div
                                        className={`text-slate-600 text-sm whitespace-pre-wrap transition-all ${expandedIds.has(q.id) ? '' : 'line-clamp-3'}`}
                                    >
                                        {q.answer}
                                    </div>

                                    {(q.answer.length > 150 || q.answer.split('\n').length > 3) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(q.id); }}
                                            className="text-xs text-indigo-500 font-medium mt-2 hover:text-indigo-700"
                                        >
                                            {expandedIds.has(q.id) ? 'Show Less' : 'Show More'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Full-Screen Modal */}
            {fullScreenQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setFullScreenQuestion(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${getCategoryStyles(fullScreenQuestion.category)}`}>
                                    {fullScreenQuestion.category}
                                </span>
                                <span className="text-sm text-slate-500">
                                    Added {new Date(fullScreenQuestion.dateAdded).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={() => setFullScreenQuestion(null)}
                                className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-8 py-10 space-y-10">
                            {/* Sources */}
                            {fullScreenQuestion.sources && fullScreenQuestion.sources.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Sources / Context</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {fullScreenQuestion.sources.map((source, idx) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {source}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Questions - Fixed Alignment */}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                                    Question{fullScreenQuestion.questions.length > 1 ? 's' : ''}
                                </h2>
                                <div className="space-y-6">
                                    {fullScreenQuestion.questions.map((qn, idx) => (
                                        <div key={idx} className="grid grid-cols-[auto,1fr] gap-4 items-start">
                                            <div className="text-right font-bold text-indigo-600 text-xl leading-tight pt-1">
                                                Q{idx + 1}.
                                            </div>
                                            <div className="text-xl leading-relaxed text-slate-900">
                                                {qn}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Answer */}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-6">Answer / Key Points</h2>
                                <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                    {fullScreenQuestion.answer}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    handleEdit(fullScreenQuestion);
                                    setFullScreenQuestion(null);
                                }}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Edit Question
                            </button>
                            <button
                                onClick={() => setFullScreenQuestion(null)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InterviewPrep;