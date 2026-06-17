import React from 'react';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';

export default function NextTopicRecommendation({
  topicName = 'Computer Networks',
  confidence = 81,
  expectedGain = '+14 marks',
  onStartLearning = () => {}
}) {
  return (
    <GlassCard className="overflow-hidden group" padding="p-0">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
            <Icon name="book" className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Recommended Next</div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-purple-400 to-cyan-400 transition-all">
          {topicName}
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-3 border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{confidence}%</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider">Confidence</div>
          </div>
          <div className="bg-bg-3 border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{expectedGain}</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider">Expected Gain</div>
          </div>
        </div>
        <button
          onClick={onStartLearning}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(139,92,246,0.35)]"
        >
          Start Learning →
        </button>
      </div>
    </GlassCard>
  );
}
