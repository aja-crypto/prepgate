import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NeuralBackground from '../components/common/NeuralBackground';
import SubjectsPage from './SubjectsPage';
import TopicsPage from './TopicsPage';
import StudyPlannerPage from './StudyPlannerPage';
import NotesPage from './NotesPage';
import RevisionPage from './RevisionPage';
import ResourcesPage from './ResourcesPage';
import FormulaSheetPage from './FormulaSheetPage';
import ShortNotesPage from './ShortNotesPage';

const TABS = [
  { id: 'subjects', label: 'Subjects' },
  { id: 'topics', label: 'Topics' },
  { id: 'planner', label: 'Planner' },
  { id: 'notes', label: 'Notes' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'short-notes', label: 'Short Notes' },
  { id: 'revision', label: 'Revision' },
  { id: 'resources', label: 'Resources' },
];

const HowItWorks = () => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left mb-4 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-400">📖 How Study Hub Works</span>
          <span className="text-gray-400 text-xs">{expanded ? 'Hide' : 'Show'}</span>
        </div>
      </button>
      {expanded && (
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">1. Select Subject</div>
            <p className="text-gray-400">Choose from all GATE subjects and track your progress</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">2. Open Topic</div>
            <p className="text-gray-400">Explore detailed concepts and study materials for each topic</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">3. Create Notes</div>
            <p className="text-gray-400">Write your own notes and save important points</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">4. Generate Short Notes</div>
            <p className="text-gray-400">Create concise revision notes for quick reference</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">5. Schedule Revision</div>
            <p className="text-gray-400">Plan your revision schedule with our smart system</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">6. Track Completion</div>
            <p className="text-gray-400">Monitor your progress and stay on track for GATE</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StudyHubPage() {
  const [activeTab, setActiveTab] = useState('subjects');

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] relative">
      <NeuralBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Dashboard</Link>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#A855F7' }}>
            📚 Study Hub
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Hub</h1>
          <p className="text-gray-400 text-sm">Your complete study workflow in one place</p>
        </div>

        <HowItWorks />

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === 'subjects' && <SubjectsPage />}
          {activeTab === 'topics' && <TopicsPage />}
          {activeTab === 'planner' && <StudyPlannerPage />}
          {activeTab === 'notes' && <NotesPage />}
          {activeTab === 'formulas' && <FormulaSheetPage />}
          {activeTab === 'short-notes' && <ShortNotesPage />}
          {activeTab === 'revision' && <RevisionPage />}
          {activeTab === 'resources' && <ResourcesPage />}
        </div>
      </div>
    </div>
  );
}
