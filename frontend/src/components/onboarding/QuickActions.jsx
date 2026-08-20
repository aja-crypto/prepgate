import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bot, Calendar, LayoutDashboard, ArrowRight } from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: LayoutDashboard, label: 'View Dashboard', path: '/dashboard', color: '#8B5CF6' },
  { icon: BookOpen, label: 'Open Learning Hub', path: '/learning-hub', color: '#06B6D4' },
  { icon: Bot, label: 'Talk to AI Mentor', path: '/mentor', color: '#A855F7' },
  { icon: Calendar, label: 'Create Today\'s Plan', path: '/planner', color: '#EC4899' },
];

const STORAGE_KEY = 'gatenexa_quick_actions_shown';

export default function QuickActions() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleAction = (path) => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    navigate(path);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: -10, scale: 0.98, x: '-50%' }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed bottom-6 z-50"
          style={{ width: 'min(92vw, 420px)', left: '50%', x: '-50%' }}
        >
          <div
            className="rounded-3xl border border-white/[0.08] p-5 overflow-hidden"
            style={{
              background: 'rgba(18,20,35,0.88)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[15px] font-bold text-white">Ready to begin?</div>
                <div className="text-[12px] text-white/40 mt-0.5">Quick actions to get started</div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors"
              >
                Dismiss
              </button>
            </div>

            <div className="space-y-2">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i, ease: [0.22, 0.61, 0.36, 1] }}
                  onClick={() => handleAction(action.path)}
                  className="w-full flex items-center gap-3 h-12 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 transition-all duration-200 px-4 text-left group"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${action.color}18`, color: action.color }}>
                    <action.icon size={16} />
                  </div>
                  <span className="flex-1 text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </motion.button>
              ))}
            </div>

            <div className="mt-3 text-center">
              <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#8B5CF6,#06B6D4)' }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 6, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
