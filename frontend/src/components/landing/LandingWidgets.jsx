import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, AnimatedCounter, AnimatedProgressBar } from './LandingAnimations';
import { api } from '../../services/api';

export function AnimatedStatistics() {
  const [stats, setStats] = useState({ resources: 500, pyqs: 3500, mocks: 55, learners: 2500 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/landing/stats');
        if (res.data.success) setStats(res.data.data);
      } catch (e) {
        console.error('Stats error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const items = [
    { label: 'Resources Available', value: stats.resources, suffix: '+', color: '#a855f7', icon: '📚' },
    { label: 'PYQs Solved', value: stats.pyqs, suffix: '+', color: '#10b981', icon: '📝' },
    { label: 'Mock Tests', value: stats.mocks, suffix: '', color: '#f59e0b', icon: '📋' },
    { label: 'Active Learners', value: stats.learners, suffix: '+', color: '#6366f1', icon: '👥' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-bg-2/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: 'spring' }}
        >
          <GlassCard className="p-6 text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: item.color }}>
              <AnimatedCounter end={item.value} duration={2000} suffix={item.suffix} />
            </div>
            <div className="text-xs text-text3">{item.label}</div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

export function MonthlyInsights() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const res = await api.get('/landing/monthly-insight');
        if (res.data.success) setInsight(res.data.data);
      } catch (e) {
        console.error('Insight error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsight();
  }, []);

  if (loading) {
    return <div className="h-64 bg-bg-2/50 rounded-2xl animate-pulse" />;
  }

  return (
    <GlassCard className="p-6" glowColor="#a855f7">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📊</span>
        <h3 className="text-lg font-bold text-text">{insight?.title || 'Monthly Insights'}</h3>
      </div>
      <p className="text-sm text-text2 mb-4">{insight?.description || 'Loading insights...'}</p>

      {insight?.topics && (
        <div className="space-y-3 mb-4">
          {insight.topics.slice(0, 4).map((topic, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-text">{topic.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text3">{topic.weightage}%</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  topic.trend === 'increasing' ? 'bg-emerald-500/20 text-emerald-400' :
                  topic.trend === 'decreasing' ? 'bg-red-500/20 text-red-400' :
                  'bg-bg-3 text-text3'
                }`}>
                  {topic.trend === 'increasing' ? '↑' : topic.trend === 'decreasing' ? '↓' : '→'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {insight?.featuredSubjects?.map((subj, i) => (
          <span key={i} className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
            {subj}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

export function QuestionSpotlight() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await api.get('/landing/question-of-month');
        if (res.data.success) setQuestion(res.data.data);
      } catch (e) {
        console.error('Question error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, []);

  if (loading) {
    return <div className="h-72 bg-bg-2/50 rounded-2xl animate-pulse" />;
  }

  return (
    <GlassCard className="p-6" glowColor="#f59e0b">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <div>
          <h3 className="text-lg font-bold text-text">Question of the Month</h3>
          <span className="text-xs text-text3">{question?.subject} • {question?.difficulty}</span>
        </div>
      </div>

      <p className="text-sm text-text mb-4">{question?.question || 'Loading...'}</p>

      <div className="space-y-2 mb-4">
        {question?.options?.map((opt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-lg bg-bg-2/50 border border-border text-sm text-text"
          >
            <span className="text-text3 mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </motion.div>
        ))}
      </div>

      {question?.hint && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-xs text-amber-400 hover:underline mb-2"
        >
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
      )}
      {showHint && <p className="text-xs text-text2 mb-4 italic">{question.hint}</p>}

      <button className="w-full py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
        View Solution
      </button>
    </GlassCard>
  );
}

export function DailyMotivation() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await api.get('/landing/motivation');
        if (res.data.success) setQuote(res.data.data);
      } catch (e) {
        console.error('Quote error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, []);

  if (loading) {
    return <div className="h-32 bg-bg-2/50 rounded-2xl animate-pulse" />;
  }

  return (
    <GlassCard className="p-6 text-center" glowColor="#6366f1">
      <div className="text-4xl mb-3">💭</div>
      <p className="text-sm italic text-text mb-3">"{quote?.quote || 'Loading...'}"</p>
      <p className="text-xs text-purple-400">— {quote?.author || 'GateNexa'}</p>
    </GlassCard>
  );
}

export function AIRPredictionWidget() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await api.get('/landing/air-prediction');
        if (res.data.success) setPrediction(res.data.data);
      } catch (e) {
        console.error('Prediction error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, []);

  if (loading) {
    return <div className="h-48 bg-bg-2/50 rounded-2xl animate-pulse" />;
  }

  return (
    <GlassCard className="p-6" glowColor="#10b981">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h3 className="text-lg font-bold text-text">AIR Prediction</h3>
      </div>

      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-emerald-400">{prediction?.estimatedAIR || 'Calculating...'}</div>
        <div className="text-xs text-text3">Estimated AIR Range</div>
      </div>

      <AnimatedProgressBar
        value={prediction?.readiness || 0}
        label="Readiness"
        color="#10b981"
      />

      <div className="mt-3 flex justify-between text-xs text-text3">
        <span>Confidence: {prediction?.confidence?.toFixed(0) || 0}%</span>
        <span>Based on: {prediction?.basedOn?.pyqsSolved || 0} PYQs</span>
      </div>
    </GlassCard>
  );
}
