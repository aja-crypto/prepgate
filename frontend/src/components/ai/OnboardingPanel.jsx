import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AiSymbol from '../ui/AiSymbol';

const YEAR_OPTIONS = [
  { value: '2027', label: 'GATE 2027', desc: 'Appearing this year' },
  { value: '2028', label: 'GATE 2028', desc: 'Planning ahead' },
  { value: '2029', label: 'GATE 2029', desc: 'Early starter' },
];

const ATTEMPT_OPTIONS = [
  { value: 'first', label: 'Yes, first attempt!' },
  { value: 'repeater', label: "No, I've attempted before" },
];

const SCORE_OPTIONS = [
  { value: '20-40', label: '20–40' },
  { value: '40-60', label: '40–60' },
  { value: '60+', label: '60+' },
  { value: 'skip', label: 'Skip' },
];

const STATUS_OPTIONS = [
  { value: 'college', label: 'College Student' },
  { value: 'final', label: 'Final Year Student' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'working', label: 'Working Professional' },
  { value: 'drop', label: 'Taking a Drop Year' },
];

const BRANCH_OPTIONS = [
  { value: 'CSE', label: 'CSE' },
  { value: 'ECE', label: 'ECE' },
  { value: 'EE', label: 'EE' },
  { value: 'ME', label: 'ME' },
  { value: 'CE', label: 'CE' },
  { value: 'Other', label: 'Other' },
];

const FAMILIARITY_OPTIONS = [
  { value: 'just-starting', label: 'Just Starting' },
  { value: 'somewhat', label: 'Somewhat Familiar' },
  { value: 'well', label: 'Well Prepared' },
];

const HOURS_OPTIONS = [
  { value: '1-2', label: '1–2h' },
  { value: '3-4', label: '3–4h' },
  { value: '5-6', label: '5–6h' },
  { value: '7+', label: '7+h' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'not-confident', label: 'Not confident' },
  { value: 'somewhat', label: 'Somewhat confident' },
  { value: 'confident', label: 'Confident' },
  { value: 'very-confident', label: 'Very confident' },
];

const TARGET_OPTIONS = [
  { value: 'qualify', label: 'Qualify (50+)' },
  { value: 'good', label: 'Good (65+)' },
  { value: 'excellent', label: 'Excellent (80+)' },
  { value: 'top', label: 'Top (90+)' },
];

const INSTITUTE_OPTIONS = [
  { value: 'top-iit', label: 'Top IIT' },
  { value: 'iit', label: 'IIT' },
  { value: 'nit', label: 'NIT' },
  { value: 'iiit', label: 'IIIT' },
  { value: 'psu', label: 'PSU' },
  { value: 'good-rank', label: 'Good Rank' },
];

const SUBJECTS_LIST = [
  'Engineering Mathematics', 'Digital Logic', 'Computer Organization',
  'Programming & DS', 'Algorithms', 'Operating Systems',
  'DBMS', 'Computer Networks', 'Theory of Computation', 'Compiler Design',
];

const STATUS_MESSAGES = {
  college: 'That is wonderful! Balancing college and GATE is completely possible. We will make a schedule around your classes.',
  final: 'Balancing placements and GATE is challenging but doable. I will help you find the right balance.',
  graduate: 'Perfect. You will have more flexibility. Let us use it wisely.',
  working: 'Respect. Managing work and GATE is not easy. We will build an efficient schedule that fits your working hours.',
  drop: 'This is a big commitment. Let us make sure every month counts.',
  default: 'Great! Let us tailor the experience for you.',
};

export default function OnboardingPanel({ colors, onComplete, fullWidth }) {
  var [messages, setMessages] = useState([]);
  var [answers, setAnswers] = useState({});
  var [isTyping, setIsTyping] = useState(false);
  var [inputType, setInputType] = useState(null);
  var [inputProps, setInputProps] = useState({});
  var [multiSelected, setMultiSelected] = useState([]);
  var [stepIndex, setStepIndex] = useState(0);
  var [completed, setCompleted] = useState(false);
  var [inputVal, setInputVal] = useState('');
  var endRef = useRef(null);
  var initRef = useRef(false);
  var totalSteps = 12;

  useEffect(function() {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, inputType]);

  useEffect(function() {
    if (completed) return;
    if (initRef.current) return;
    initRef.current = true;
    runStep(stepIndex);
  }, [stepIndex]);

  function addMessage(msg) {
    setMessages(function(prev) { return prev.concat([msg]); });
  }

  function showMentorTexts(texts, onDone) {
    var i = 0;
    setIsTyping(true);
    function next() {
      if (i >= texts.length) {
        setIsTyping(false);
        onDone?.();
        return;
      }
      addMessage({ role: 'mentor', text: texts[i] });
      i++;
      setTimeout(next, 500 + Math.random() * 400);
    }
    setTimeout(next, 400);
  }

  function showChips(options) {
    setInputType('chips');
    setInputProps({ options: options });
  }

  function showInput(placeholder) {
    setInputType('input');
    setInputProps({ placeholder: placeholder || 'Type here...' });
  }

  function showMulti(options) {
    setInputType('multi');
    setInputProps({ options: options });
    setMultiSelected([]);
  }

  function getAnswerKey(idx) {
    var isFirst = answers.attempt === 'first';
    var firstKeys = { 3: 'status', 4: 'branch', 5: 'familiarity', 6: 'hours', 7: 'subjects', 8: 'confidence', 9: 'target', 10: 'institute' };
    var repeaterKeys = { 3: 'previousScore', 4: 'status', 5: 'branch', 6: 'familiarity', 7: 'hours', 8: 'subjects', 9: 'confidence', 10: 'target', 11: 'institute' };
    var commonKeys = { 1: 'year', 2: 'attempt' };
    return commonKeys[idx] || (isFirst ? firstKeys[idx] : repeaterKeys[idx]);
  }

  function runStep(idx) {
    switch (idx) {
      case 0:
        showMentorTexts([
          "Hi! I am Nexa AI.\n\nBefore we start... What should I call you?",
        ], function() { showInput('Enter your name...'); });
        return;

      case 1:
        showMentorTexts([
          'Nice to meet you ' + (answers.name || '') + '! I will remember that.',
          'Let us make sure you achieve your dream college.',
          'Which GATE exam are you preparing for?',
        ], function() { showChips(YEAR_OPTIONS); });
        return;

      case 2:
        var ym = answers.year === '2027'
          ? 'Awesome choice! 2027 gives us enough time to build strong concepts. No need to rush. We will prepare strategically.'
          : 'Planning ahead — I like that! Let us start early and stay ahead.';
        showMentorTexts([
          ym,
          'Is this your first GATE attempt?',
        ], function() { showChips(ATTEMPT_OPTIONS); });
        return;

      // Step 3 branches: first attempt → status, repeater → score
      case 3:
        if (answers.attempt === 'first') {
          showMentorTexts([
            "That is exciting! Every AIR 1 was once a first-time aspirant. We will build your preparation from scratch. You don't have to know everything today.",
            'Tell me a little about yourself.',
          ], function() { showChips(STATUS_OPTIONS); });
        } else {
          showMentorTexts([
            'Welcome back. Many toppers cracked GATE in their second attempt. This time we will prepare smarter.',
            "If you are comfortable... Can you tell me your previous GATE score?",
          ], function() { showChips(SCORE_OPTIONS); });
        }
        return;

      // Step 4 branches: first → branch, repeater → status
      case 4:
        if (answers.attempt === 'first') {
          showMentorTexts([
            STATUS_MESSAGES[answers.status] || STATUS_MESSAGES.default,
            'Awesome. Now tell me which branch you are preparing from.',
          ], function() { showChips(BRANCH_OPTIONS); });
        } else {
          var scoreText = answers.previousScore === 'skip'
            ? "No worries. We don't need the past to build your future. Let us focus on this attempt."
            : "That is actually a good starting point. With consistent preparation, there is absolutely room for improvement. Let us aim much higher this time.";
          showMentorTexts([
            scoreText,
            'Tell me a little about yourself.',
          ], function() { showChips(STATUS_OPTIONS); });
        }
        return;

      // Step 5 branches: first → familiarity, repeater → branch
      case 5:
        if (answers.attempt === 'first') {
          showMentorTexts([
            'How familiar are you with the GATE exam pattern?',
          ], function() { showChips(FAMILIARITY_OPTIONS); });
        } else {
          showMentorTexts([
            STATUS_MESSAGES[answers.status] || STATUS_MESSAGES.default,
            'Awesome. Now tell me which branch you are preparing from.',
          ], function() { showChips(BRANCH_OPTIONS); });
        }
        return;

      // Step 6 branches: first → hours, repeater → familiarity
      case 6:
        if (answers.attempt === 'first') {
          showMentorTexts([
            'Realistically... How much time can you study every day?\n\nDon\'t worry. You can always change this later.',
          ], function() { showChips(HOURS_OPTIONS); });
        } else {
          showMentorTexts([
            'How familiar are you with the GATE exam pattern?',
          ], function() { showChips(FAMILIARITY_OPTIONS); });
        }
        return;

      // Step 7 branches: first → subjects, repeater → hours
      case 7:
        if (answers.attempt === 'first') {
          showMentorTexts([
            'Which subjects have you already studied?',
          ], function() { showMulti(SUBJECTS_LIST); });
        } else {
          showMentorTexts([
            'Realistically... How much time can you study every day?\n\nDon\'t worry. You can always change this later.',
          ], function() { showChips(HOURS_OPTIONS); });
        }
        return;

      // Step 8 branches: first → confidence, repeater → subjects
      case 8:
        if (answers.attempt === 'first') {
          showMentorTexts([
            "Let's understand your confidence. This helps me create a better roadmap.",
            'How confident do you feel about your preparation overall?',
          ], function() { showChips(CONFIDENCE_OPTIONS); });
        } else {
          showMentorTexts([
            'Which subjects have you already studied?',
          ], function() { showMulti(SUBJECTS_LIST); });
        }
        return;

      // Step 9 branches: first → target, repeater → confidence
      case 9:
        if (answers.attempt === 'first') {
          showMentorTexts([
            'One more important question. Dreams become plans only after setting a target.',
            'What target score are you aiming for?',
          ], function() { showChips(TARGET_OPTIONS); });
        } else {
          showMentorTexts([
            "Let's understand your confidence. This helps me create a better roadmap.",
            'How confident do you feel about your preparation overall?',
          ], function() { showChips(CONFIDENCE_OPTIONS); });
        }
        return;

      // Step 10 branches: first → institute, repeater → target
      case 10:
        if (answers.attempt === 'first') {
          showMentorTexts([
            'If everything goes perfectly... Which college would make you happiest?',
          ], function() { showChips(INSTITUTE_OPTIONS); });
        } else {
          showMentorTexts([
            'One more important question. Dreams become plans only after setting a target.',
            'What target score are you aiming for?',
          ], function() { showChips(TARGET_OPTIONS); });
        }
        return;

      // Step 11: repeater → institute, first → complete
      case 11:
        if (answers.attempt === 'repeater') {
          showMentorTexts([
            'If everything goes perfectly... Which college would make you happiest?',
          ], function() { showChips(INSTITUTE_OPTIONS); });
          return;
        }
        // First attempt falls through to complete
        finishOnboarding();
        return;

      // Step 12: complete (only for repeater)
      case 12:
        finishOnboarding();
        return;
    }
  }

  function finishOnboarding() {
    showMentorTexts([
      'Perfect ' + (answers.name || '') + '! I know enough to become your mentor.',
      'Now let me analyse your profile...',
    ], function() {
      setCompleted(true);
      onComplete?.(answers);
    });
  }

  function advance() {
    setStepIndex(function(p) { return p + 1; });
  }

  function onNameSubmit(e) {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    var val = inputVal.trim();
    addMessage({ role: 'user', text: val });
    setAnswers(function(p) { return { ...p, name: val }; });
    setInputVal('');
    setInputType(null);
    setTimeout(function() { advance(); }, 400);
  }

  function handleChip(value, label) {
    addMessage({ role: 'user', text: label || String(value) });
    setAnswers(function(p) {
      var key = getAnswerKey(stepIndex);
      if (!key) return p;
      return { ...p, [key]: value };
    });
    setInputType(null);
    setTimeout(function() { advance(); }, 350);
  }

  function handleMultiDone() {
    if (multiSelected.length === 0) return;
    var label = multiSelected.length + ' subjects selected';
    addMessage({ role: 'user', text: label });
    setAnswers(function(p) { return { ...p, subjects: multiSelected }; });
    setMultiSelected([]);
    setInputType(null);
    setTimeout(function() { advance(); }, 350);
  }

  function toggleMulti(opt) {
    setMultiSelected(function(p) {
      return p.indexOf(opt) >= 0 ? p.filter(function(v) { return v !== opt; }) : p.concat([opt]);
    });
  }

  var currentDisplayStep = (function() {
    if (answers.attempt === 'first') {
      return { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12 }[stepIndex] || stepIndex + 1;
    }
    return stepIndex + 1;
  })();

  var displayTotal = answers.attempt === 'first' ? 12 : 13;
  var progressPct = Math.min(100, Math.round((currentDisplayStep / displayTotal) * 100));

  if (completed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 64, textAlign: 'center',
      }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.3 }}>
          <AiSymbol size={56} glow={true} />
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: '20px 0 8px' }}>
          Done!
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ fontSize: 13, color: colors.text3, lineHeight: 1.6, margin: 0 }}>
          I have prepared your personal GATE journey.
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{ fontSize: 13, color: colors.accent, lineHeight: 1.6, margin: '4px 0 0' }}>
          From now on, I will guide you every single day.
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          style={{ fontSize: 13, color: colors.text3, lineHeight: 1.6, margin: '4px 0 0' }}>
          Let us begin.
        </motion.p>
        <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
          style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #7C3AED, #8B5CF6)', marginTop: 24 }} />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: fullWidth ? '24px 32px 16px' : '20px 20px 12px',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {/* Progress */}
      <div style={{ marginBottom: fullWidth ? 24 : 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.text4, marginBottom: 6 }}>
          <span style={{ fontWeight: 500 }}>Setting up your journey</span>
          <span style={{ fontFamily: 'monospace' }}>{currentDisplayStep} / {displayTotal}</span>
        </div>
        <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: progressPct + '%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #7C3AED, #8B5CF6)', boxShadow: '0 0 8px rgba(139,92,246,0.35)' }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', marginBottom: 16 }}>
        <AnimatePresence>
          {messages.map(function(msg, i) {
            var isMentor = msg.role === 'mentor';
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'flex', gap: 10, marginBottom: 14,
                  justifyContent: isMentor ? 'flex-start' : 'flex-end',
                }}>
                {isMentor && (
                  <div style={{ flexShrink: 0, marginTop: 4 }}><AiSymbol size={28} /></div>
                )}
                <div style={{
                  maxWidth: fullWidth ? '68%' : '88%',
                  padding: '13px 17px',
                  borderRadius: isMentor ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                  background: isMentor ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.12)',
                  border: '1px solid ' + (isMentor ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.15)'),
                  fontSize: 13.5, color: colors.text, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
                {!isMentor && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 4,
                    background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: colors.text, fontWeight: 600,
                  }}>
                    {answers.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ flexShrink: 0 }}><AiSymbol size={28} /></div>
            <div style={{
              padding: '12px 18px', borderRadius: '4px 18px 18px 18px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ display: 'flex', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.accent, animation: 'bounce 1.4s infinite' }} />
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.accent, animation: 'bounce 1.4s infinite 0.2s' }} />
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.accent, animation: 'bounce 1.4s infinite 0.4s' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {!isTyping && inputType === 'input' && (
        <form onSubmit={onNameSubmit} style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={inputVal} onChange={function(e) { setInputVal(e.target.value); }}
              placeholder={inputProps.placeholder || 'Type here...'} autoFocus
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 14, fontSize: 13,
                background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border,
                color: colors.text, outline: 'none', fontFamily: 'inherit',
              }} />
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px 20px', borderRadius: 14, fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                border: 'none', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              Send
            </motion.button>
          </div>
        </form>
      )}

      {!isTyping && inputType === 'chips' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
          {inputProps.options.map(function(opt, i) {
            return (
              <motion.button key={opt.value}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                onClick={function() { handleChip(opt.value, opt.label); }}
                style={{
                  padding: opt.desc ? '12px 18px' : '10px 16px',
                  borderRadius: 14, fontSize: 13, fontWeight: 500,
                  border: '1px solid rgba(139,92,246,0.2)',
                  background: 'rgba(139,92,246,0.08)',
                  color: colors.text, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.4,
                  flex: opt.desc ? '1 1 calc(50% - 4px)' : 'auto',
                }}>
                <div>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: 10, color: colors.text4, marginTop: 2 }}>{opt.desc}</div>}
              </motion.button>
            );
          })}
        </div>
      )}

      {!isTyping && inputType === 'multi' && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {inputProps.options.map(function(opt) {
              var selected = multiSelected.indexOf(opt) >= 0;
              return (
                <motion.button key={opt} whileHover={{ scale: 1.02, boxShadow: selected ? '0 0 12px rgba(139,92,246,0.3)' : 'none' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={function() { toggleMulti(opt); }}
                  style={{
                    padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                    border: '1px solid ' + (selected ? 'rgba(139,92,246,0.4)' : colors.border),
                    background: selected ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                    color: selected ? colors.accentHover : colors.text2,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: selected ? '0 0 8px rgba(139,92,246,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}>
                  {selected ? '✓ ' : ''}{opt}
                </motion.button>
              );
            })}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleMultiDone}
            style={{
              padding: '8px 20px', borderRadius: 12, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(139,92,246,0.3)',
              background: 'rgba(139,92,246,0.1)',
              color: colors.accentHover, cursor: 'pointer',
              opacity: multiSelected.length > 0 ? 1 : 0.5,
              fontFamily: 'inherit',
            }}>
            Done ({multiSelected.length})
          </motion.button>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
