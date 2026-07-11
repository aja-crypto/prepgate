import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocus } from '../../context/FocusContext';
import { CheckCircle, Clock, BookOpen, Zap, MessageSquare, Plus, X } from 'lucide-react';

const QUICK_TASKS = [
  'Finished reading notes',
  'Solved PYQs',
  'Revised concepts',
  'Made handwritten notes',
  'Watched video lecture',
  'Practiced problems',
  'Reviewed flashcards',
];

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } },
  item: { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } },
};

export default function SessionCompletionDialog() {
  const { showCompletion, completedSession, dismissCompletion, saveSessionNotes, formatTime } = useFocus();
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState([]);
  const [customTask, setCustomTask] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (showCompletion) {
      setNotes('');
      setTasks([]);
      setCustomTask('');
      setShowCustom(false);
    }
  }, [showCompletion]);

  const addTask = (task) => {
    if (task && !tasks.includes(task)) {
      setTasks([...tasks, task]);
    }
    setCustomTask('');
    setShowCustom(false);
  };

  const removeTask = (task) => {
    setTasks(tasks.filter(t => t !== task));
  };

  const handleSave = () => {
    if (completedSession) {
      saveSessionNotes(completedSession.id, notes, tasks);
    }
    dismissCompletion();
  };

  const handleSkip = () => {
    dismissCompletion();
  };

  if (!showCompletion || !completedSession) return null;

  const duration = completedSession.duration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const startTime = new Date(completedSession.startTime);
  const endTime = new Date(completedSession.endTime);
  const formatTimeShort = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl p-6"
          style={{ background: 'rgba(10,14,26,0.98)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <CheckCircle size={32} className="text-green-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-1">Session Completed</h2>
            <p className="text-sm text-slate-400">Great work! Here's what you accomplished:</p>
          </div>

          {/* Session Details */}
          <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-3 mb-6">
            <motion.div variants={stagger.item} transition={{ duration: 0.25 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
              <Clock size={16} className="text-purple-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">Time Studied</div>
                <div className="text-sm font-semibold text-white">{durationText}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">{formatTimeShort(startTime)} – {formatTimeShort(endTime)}</div>
              </div>
            </motion.div>

            <motion.div variants={stagger.item} transition={{ duration: 0.25 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)' }}>
              <BookOpen size={16} className="text-cyan-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">Subject</div>
                <div className="text-sm font-semibold text-white">{completedSession.subject}</div>
              </div>
            </motion.div>

            <motion.div variants={stagger.item} transition={{ duration: 0.25 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.1)' }}>
              <Zap size={16} className="text-yellow-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">XP Earned</div>
                <div className="text-sm font-semibold text-white">+{completedSession.xpEarned} XP</div>
              </div>
            </motion.div>
          </motion.div>

          {/* What did you complete? */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">What did you complete?</span>
            </div>

            {/* Quick task buttons */}
            <motion.div variants={stagger.container} initial="initial" animate="animate" className="flex flex-wrap gap-2 mb-3">
              {QUICK_TASKS.map(task => (
                <motion.button
                  key={task}
                  variants={stagger.item}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addTask(task)}
                  disabled={tasks.includes(task)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={tasks.includes(task)
                    ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ADE80', opacity: 0.7 }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }
                  }
                >
                  {tasks.includes(task) ? '✓ ' : ''}{task}
                </motion.button>
              ))}
              <motion.button
                variants={stagger.item}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCustom(!showCustom)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}
              >
                <Plus size={10} /> Custom
              </motion.button>
            </motion.div>

            {/* Custom task input */}
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3"
                >
                  <div className="flex gap-2">
                    <input
                      value={customTask}
                      onChange={e => setCustomTask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask(customTask)}
                      placeholder="e.g., Solved 25 PYQs"
                      className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <button
                      onClick={() => addTask(customTask)}
                      disabled={!customTask.trim()}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' }}
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected tasks */}
            <AnimatePresence mode="popLayout">
              {tasks.map(task => (
                <motion.div
                  key={task}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="flex items-center gap-2 p-2 rounded-lg mb-2"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}
                >
                  <CheckCircle size={12} className="text-green-400 shrink-0" />
                  <span className="text-[11px] text-white flex-1">{task}</span>
                  <button onClick={() => removeTask(task)} className="text-slate-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Optional notes */}
          <div className="mb-6">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Optional Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any thoughts about this session..."
              rows={2}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Action buttons */}
          <motion.div variants={stagger.container} initial="initial" animate="animate" className="flex gap-3">
            <motion.button
              variants={stagger.item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}
            >
              Skip
            </motion.button>
            <motion.button
              variants={stagger.item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}
            >
              Save & Continue
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
