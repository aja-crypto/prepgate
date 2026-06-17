import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NeuralBackground from '../components/common/NeuralBackground';
import AIMentorPage from './AIMentorPage';
import DailyCoachPage from './DailyCoachPage';
import WeakTopicsPage from './WeakTopicsPage';
import InsightsPage from './InsightsPage';
import DoubtSolverPage from './DoubtSolverPage';
import PrepGateAIIcon from '../components/ui/PrepGateAIIcon';

const TABS = [
  { id: 'mentor', label: 'Ask AI' },
  { id: 'coach', label: 'Daily Guidance' },
  { id: 'weak-topics', label: 'Weak Topic Analysis' },
  { id: 'insights', label: 'Progress Insights' },
  { id: 'doubt', label: 'Doubt Solver' },
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
          <span className="text-sm font-semibold text-purple-400">🤖 How PrepGate AI Works</span>
          <span className="text-gray-400 text-xs">{expanded ? 'Hide' : 'Show'}</span>
        </div>
      </button>
      {expanded && (
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Ask Doubts</div>
            <p className="text-gray-400">Get instant answers to your GATE-related questions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Generate Study Plans</div>
            <p className="text-gray-400">Create personalized study plans based on your goals</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Analyze Weak Topics</div>
            <p className="text-gray-400">Identify areas where you need to focus more</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Suggest Revisions</div>
            <p className="text-gray-400">Get smart revision suggestions based on your progress</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Track Progress</div>
            <p className="text-gray-400">Monitor your GATE preparation journey with insights</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PrepGateAIPage() {
  const [activeTab, setActiveTab] = useState('mentor');

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] relative">
      <NeuralBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Dashboard</Link>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#A855F7' }}>
            🤖 PrepGate AI
          </div>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <PrepGateAIIcon size={64} />
          <div>
            <h1 className="text-3xl font-bold mb-2">PrepGate AI</h1>
            <p className="text-gray-400 text-sm">Your GATE 2027 Co-Pilot</p>
          </div>
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
          {activeTab === 'mentor' && <AIMentorPage />}
          {activeTab === 'coach' && <DailyCoachPage />}
          {activeTab === 'weak-topics' && <WeakTopicsPage />}
          {activeTab === 'insights' && <InsightsPage />}
          {activeTab === 'doubt' && <DoubtSolverPage />}
        </div>
      </div>
    </div>
  );
}
