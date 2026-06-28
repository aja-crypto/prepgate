// AI study planner — GPT when OPENAI_API_KEY is set, heuristic fallback otherwise
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validateFields } = require('../middleware/validateInput');
const aiUsage = require('../services/aiUsageTracker');

let lastAiError = null;

// Last error is now declared at the top of this file

/**
 * Generic AI API caller supporting OpenAI and DashScope (Aliyun)
 */
async function callAiApi(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[callAiApi] No API key configured');
    lastAiError = 'No API key configured';
    return null;
  }

  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const isDashScope = !isOpenRouter && apiKey.startsWith('al-');
  let endpoint, model;

  if (isOpenRouter) {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  } else if (isDashScope) {
    endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    model = process.env.DASHSCOPE_MODEL || 'qwen-plus';
  } else {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  console.log(`[callAiApi] Calling ${model} via ${isOpenRouter ? 'OpenRouter' : isDashScope ? 'DashScope' : 'OpenAI'}`);

  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) console.log(`[callAiApi] Retry attempt ${attempt}/${maxRetries}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s < frontend 15s timeout

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(isOpenRouter ? { 'HTTP-Referer': 'https://GateNexa.app', 'X-Title': 'GateNexa' } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1500,
          response_format: options.response_format || { type: 'text' },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: 'Unknown error' }));
        const errorDetail = errorBody.error?.message || errorBody.message || 'Unknown error';

        if (res.status === 429) {
          console.error(`[callAiApi] Rate limited (429) attempt ${attempt + 1}: ${errorDetail}`);
          if (attempt < maxRetries) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
            console.log(`[callAiApi] Waiting ${retryAfter}s before retry...`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            continue;
          }
          lastAiError = 'AI service rate limited. Please wait and try again.';
        } else if (res.status === 401 || res.status === 403) {
          console.error(`[callAiApi] Auth error (${res.status}): ${errorDetail}`);
          lastAiError = 'AI API authentication failed. Check your API key.';
        } else if (res.status >= 500) {
          console.error(`[callAiApi] Server error (${res.status}) attempt ${attempt + 1}: ${errorDetail}`);
          if (attempt < maxRetries) {
            console.log('[callAiApi] Retrying after server error...');
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          lastAiError = `AI service temporarily unavailable (${res.status}). Please try again later.`;
        } else {
          console.error(`[callAiApi] API error (${res.status}): ${errorDetail}`);
          lastAiError = `AI API error: ${errorDetail}`;
        }
        return null;
      }

      const json = await res.json();

      if (!json.choices?.[0]?.message) {
        console.error('[callAiApi] Malformed response — missing choices[0].message:', JSON.stringify(json).slice(0, 500));
        lastAiError = 'AI returned an unexpected response format';
        return null;
      }

      const content = json.choices[0].message.content;
      if (!content) {
        console.error('[callAiApi] AI returned empty content');
        lastAiError = 'AI returned an empty response';
        return null;
      }

      console.log(`[callAiApi] Success: ${content.length} chars`);
      lastAiError = null;
      return content;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        console.error(`[callAiApi] Timeout (attempt ${attempt + 1})`);
        if (attempt < maxRetries) {
          console.log('[callAiApi] Retrying after timeout...');
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        lastAiError = 'AI request timed out. Please try again.';
      } else {
        console.error(`[callAiApi] Fetch error (attempt ${attempt + 1}):`, err.message);
        if (attempt < maxRetries) {
          console.log('[callAiApi] Retrying after fetch error...');
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        lastAiError = `AI request failed: ${err.message}`;
      }
    }
  }

  console.error('[callAiApi] All retry attempts exhausted');
  return null;
}

function buildHeuristicPlan(body) {
  const { subjects = [], topics = [], dailyHours = 8, period = 'week' } = body;
  const incomplete = topics.filter((t) => !t.done);
  const weakSubjects = [...subjects].sort((a, b) => (a.progress || 0) - (b.progress || 0));
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (period === 'day') {
    const primarySubject = weakSubjects[0]?.name || 'DBMS';
    const secondarySubject = weakSubjects[1]?.name || 'Computer Networks';
    const primaryTopic = incomplete.find((t) => t.subject === primarySubject) || incomplete[0];
    const secondaryTopic = incomplete.find((t) => t.subject === secondarySubject) || incomplete[1];

    return [
      {
        day: '1',
        subject: primarySubject,
        topic: `Revise ${primaryTopic?.name || 'Deadlocks'}`,
        hours: Math.max(1, Math.min(2, dailyHours / 4)),
        tasks: ['Read short notes', 'Make a one-page formula sheet'],
      },
      {
        day: '2',
        subject: primarySubject,
        topic: `Solve 20 ${primarySubject.split(' ')[0]} PYQs`,
        hours: Math.max(1, Math.min(2, dailyHours / 4)),
        tasks: ['Time-box the set', 'Review every mistake'],
      },
      {
        day: '3',
        subject: secondarySubject,
        topic: `Complete ${secondaryTopic?.name || 'Routing'}`,
        hours: Math.max(1, Math.min(2, dailyHours / 4)),
        tasks: ['Rewatch the tricky concepts', 'Attempt 5 practice questions'],
      },
      {
        day: '4',
        subject: 'Theory of Computation',
        topic: 'Take TOC Quiz',
        hours: Math.max(1, Math.min(2, dailyHours / 4)),
        tasks: ['Attempt 15 mixed questions', 'Mark weak subtopics for revision'],
      },
    ];
  }

  if (weakSubjects.length === 0 && incomplete.length === 0) {
    return days.map(day => ({
      day,
      subject: 'Mixed Review',
      topic: 'General Revision',
      hours: dailyHours,
      tasks: ['Review core concepts', 'Solve 5 PYQs', 'Mock analysis']
    }));
  }

  return days.map((day, i) => {
    const sub = weakSubjects[i % Math.max(weakSubjects.length, 1)];
    const topic = (incomplete.filter(t => t.subject === sub?.name) || [])[0] || incomplete[i % Math.max(incomplete.length, 1)];
    return {
      day,
      subject: sub?.name || 'Mixed Review',
      topic: topic?.name || 'Revision',
      hours: dailyHours,
      tasks: [
        topic ? `Study: ${topic.name}` : 'Review core concepts',
        'Solve 2–3 PYQs',
        i % 2 === 0 ? 'Formula revision (30 min)' : 'Mock analysis / weak area drill',
      ],
    };
  });
}

async function buildGptPlan(body) {
  const { subjects = [], topics = [], pyqs = [], mocks = [], dailyHours = 8, period = 'week' } = body;
  const incomplete = topics.filter((t) => !t.done).slice(0, 15);
  const unsolvedPyqs = pyqs.filter((p) => !p.solved).slice(0, 10);
  const recentMock = mocks[mocks.length - 1];

  const prompt = period === 'day'
    ? `You are a GATE CSE 2027 study coach. Create a TODAY study plan as a JSON array with exactly 4 items.
Each item must be an object with: { "day": "1", "subject": "...", "topic": "...", "hours": number, "tasks": ["...", "..."] }
Make it concrete and exam-focused. Use short, actionable items like "Revise Deadlocks", "Solve 20 DBMS PYQs", "Complete CN Routing", and "Take TOC Quiz" when relevant.
Daily target: ${dailyHours} hours. Focus weak subjects first.

Weak subjects: ${subjects.filter((s) => s.progress < 60).map((s) => `${s.name} (${s.progress}%)`).join(', ') || 'none'}
Incomplete topics: ${incomplete.map((t) => `${t.name} (${t.subject})`).join(', ') || 'none'}
Unsolved PYQs: ${unsolvedPyqs.map((p) => p.title).join(', ') || 'none'}
Latest mock: ${recentMock ? `${recentMock.name} — ${recentMock.score} marks, notes: ${recentMock.notes || 'none'}` : 'none'}

Return ONLY valid JSON array with 4 items.`
    : `You are a GATE CSE 2027 study coach. Create a ${period}ly study plan as JSON array.
Each item: { "day": "Monday", "subject": "...", "topic": "...", "hours": number, "tasks": ["...", "..."] }
Daily target: ${dailyHours} hours. Focus weak subjects first.

Weak subjects: ${subjects.filter((s) => s.progress < 60).map((s) => `${s.name} (${s.progress}%)`).join(', ') || 'none'}
Incomplete topics: ${incomplete.map((t) => `${t.name} (${t.subject})`).join(', ') || 'none'}
Unsolved PYQs: ${unsolvedPyqs.map((p) => p.title).join(', ') || 'none'}
Latest mock: ${recentMock ? `${recentMock.name} — ${recentMock.score} marks, notes: ${recentMock.notes || 'none'}` : 'none'}

Return ONLY valid JSON array, 7 items for a week.`;

  const messages = [
    { role: 'system', content: 'You output only valid JSON arrays for GATE study plans.' },
    { role: 'user', content: prompt },
  ];

  try {
    const text = await callAiApi(messages, { response_format: { type: 'json_object' } });
    if (!text) throw new Error('AI Response empty');

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in response');
    
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Failed to build GPT plan, falling back to heuristic:', e.message);
    return buildHeuristicPlan(body);
  }
}

router.post('/planner', protect, validateFields([
  { name: 'hoursPerDay', type: 'number', required: true, min: 1, max: 24 },
]), async (req, res, next) => {
  const planStart = Date.now();
  try {
    let plan;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Set OPENROUTER_API_KEY in .env';
      } else {
        plan = await buildGptPlan(req.body);
        if (plan?.length) {
          source = 'gpt';
        } else {
          aiError = 'AI returned empty response. Using smart fallback plan.';
        }
      }
    } catch (e) {
      aiError = `AI request failed: ${e.message}. Using smart fallback plan.`;
      plan = null;
    }

    if (!plan?.length) {
      plan = buildHeuristicPlan(req.body);
    }

    aiUsage.increment(true, Date.now() - planStart);
    res.json({ success: true, data: { plan, source, aiError } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - planStart);
    next(e);
  }
});

function buildHeuristicRecommendations(data) {
  const recommendations = [];
  const { subjects = [], topics = [], pyqs = [], mocks = [], gateFeatures = {}, studyStats = {} } = data;

  const incompleteTopics = topics.filter(t => !t.done);
  const completedTopics = topics.filter(t => t.done);
  const overallProgress = data.overall?.percentage || 0;

  // 1. What Should I Study Next?
  if (incompleteTopics.length > 0) {
    // Prioritize topics from weak subjects or high weightage (simulated weightage)
    const nextTopic = incompleteTopics[0];
    recommendations.push({
      type: 'next_study',
      title: 'Next High-Impact Topic',
      content: `Based on your progress, you should tackle "${nextTopic.name}" in ${nextTopic.subject}. It's a high-impact topic for GATE.`,
      action: '/topics'
    });
  }

  // 2. Revision Suggestions
  const dueForRevision = pyqs.filter(p => p.revisionNeeded);
  if (dueForRevision.length > 0) {
    recommendations.push({
      type: 'revision',
      title: 'Revision Due',
      content: `You have ${dueForRevision.length} questions marked for revision. Spaced repetition is key to retention.`,
      action: '/revision'
    });
  }

  // 3. Weak Subject Detection & Score Improvement
  const weakSubjects = subjects.filter(s => s.progress > 0 && s.progress < 50).sort((a, b) => a.progress - b.progress);
  if (weakSubjects.length > 0) {
    const s = weakSubjects[0];
    recommendations.push({
      type: 'weak_area',
      title: `Improve ${s.name}`,
      content: `Your progress in ${s.name} is ${s.progress}%. Focusing on its core topics could boost your score by 4-6 marks.`,
      action: '/subjects'
    });
  }

  // 4. Mock Test Suggestions
  if (mocks.length === 0 && overallProgress > 20) {
    recommendations.push({
      type: 'mock_test',
      title: 'Time for a Mock Test',
      content: "You've covered significant ground. Take a subject-wise mock test to validate your learning.",
      action: '/mocks'
    });
  } else if (mocks.length > 0) {
    const avgScore = mocks.reduce((acc, m) => acc + (m.score || 0), 0) / mocks.length;
    if (avgScore < 60) {
      recommendations.push({
        type: 'mock_test',
        title: 'Strategy Shift',
        content: "Your average mock score is below 60%. Try analyzing your mistake patterns before the next test.",
        action: '/analytics'
      });
    }
  }

  // 5. Daily Plan Generator (Simulated)
  recommendations.push({
    type: 'plan',
    title: "Today's Focus Plan",
    content: `1. 2 hours: ${incompleteTopics[0]?.name || 'New Topic'} | 2. 1 hour: Revision | 3. 30 mins: Practice 5 PYQs.`,
    action: '/dashboard'
  });

  // 6. Mistake Pattern Analysis (Heuristic)
  const accuracy = pyqs.length > 0 ? (pyqs.filter(p => p.status === 'correct').length / pyqs.length) * 100 : 100;
  if (accuracy < 70) {
    recommendations.push({
      type: 'mistake_analysis',
      title: 'Accuracy Alert',
      content: "Your PYQ accuracy is below 70%. You might be making silly mistakes or have conceptual gaps in core areas.",
      action: '/pyq'
    });
  }

  // 7. Study Health
  const weeklyHours = studyStats.weeklyHours || [0, 0, 0, 0, 0, 0, 0];
  const totalHours = weeklyHours.reduce((a, b) => a + b, 0);
  if (totalHours > 50) {
    recommendations.push({
      type: 'health',
      title: 'Burnout Risk',
      content: "High study volume detected. Ensure you're taking adequate breaks to maintain long-term focus.",
      action: '/productivity'
    });
  } else if (totalHours < 10 && totalHours > 0) {
     recommendations.push({
      type: 'health',
      title: 'Consistency Check',
      content: "Study hours are lower than usual. Try to aim for at least 3-4 hours daily for consistent growth.",
      action: '/productivity'
    });
  }

  // 8. Exam Readiness
  let status = 'Beginner';
  if (overallProgress > 75) status = 'Exam Ready';
  else if (overallProgress > 40) status = 'Intermediate';

  recommendations.push({
    type: 'readiness',
    title: 'Milestone: ' + status,
    content: `You've completed ${overallProgress}% of the syllabus. You are moving towards the ${status === 'Beginner' ? 'Intermediate' : 'Advanced'} phase.`,
    action: '/analytics'
  });

  return recommendations;
}

async function buildGptRecommendations(data) {
  const prompt = `You are a GATE CSE 2027 AI Mentor. Analyze the following student data and provide 6-8 personalized, actionable recommendations and "Smart Messages".
Return ONLY a JSON array of objects: { "type": "string", "title": "string", "content": "string", "action": "string" }

Categories to cover:
1. What Should I Study Next? (Based on weightage/dependency)
2. Revision Suggestions (Spaced repetition)
3. Weak Subject Detection (Low accuracy/progress)
4. Mock Test Suggestions (When to take, what to focus on)
5. Daily/Weekly Plan (A concise roadmap)
6. Score Improvement (Specific topics to gain marks)
7. Mistake Pattern Analysis (Silly mistakes vs Concept gaps)
8. Study Health (Burnout, consistency)
9. Exam Readiness (Level: Beginner, Intermediate, Pro)

Types: next_study, revision, weak_area, mock_test, insight, health, readiness, plan, mistake_analysis.
Actions: /topics, /revision, /subjects, /mocks, /dashboard, /productivity, /analytics, /pyq.

Data:
- Subjects: ${JSON.stringify(data.subjects?.map(s => ({ name: s.name, progress: s.progress })))
}
- Recent Mocks: ${JSON.stringify(data.mocks?.slice(-5))}
- Streak: ${data.gateFeatures?.streak?.current || 0}
- Total Progress: ${data.overall?.percentage || 0}%
- Study Hours (Mon-Sun): ${JSON.stringify(data.studyStats?.weeklyHours)}

Provide specific, professional, and highly motivating advice for a GATE aspirant. Use technical terms like "Normalization", "Paging", "Asymptotic Analysis" if relevant to weak areas.`;

  const messages = [
    { role: 'system', content: 'You are a helpful GATE CSE 2027 mentor that outputs recommendations as JSON arrays.' },
    { role: 'user', content: prompt },
  ];

  const text = await callAiApi(messages, { response_format: { type: 'json_object' } });
  if (!text) return null;

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Failed to parse AI recommendations:', e);
    return null;
  }
}

router.post('/recommendations', protect, validateFields([
  { name: 'subjects', type: 'array', required: false },
  { name: 'topics', type: 'array', required: false },
  { name: 'mocks', type: 'array', required: false },
  { name: 'pyqs', type: 'array', required: false },
]), async (req, res, next) => {
  const recStart = Date.now();
  try {
    let recommendations;
    let analysis;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Using smart analysis instead.';
      } else {
        const result = await buildGptAnalysis(req.body);
        if (result) {
          recommendations = result.recommendations;
          analysis = result.analysis;
          source = 'gpt';
        } else {
          aiError = 'AI analysis unavailable. Using smart analysis instead.';
        }
      }
    } catch (e) {
      aiError = `AI request failed: ${e.message}. Using smart analysis instead.`;
    }

    if (!recommendations) {
      recommendations = buildHeuristicRecommendations(req.body);
      analysis = buildHeuristicAnalysis(req.body);
    }

    aiUsage.increment(true, Date.now() - recStart);
    res.json({ success: true, data: { recommendations, analysis, source, aiError } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - recStart);
    next(e);
  }
});

router.post('/chat', protect, validateFields([
  { name: 'message', type: 'string', required: true, min: 1, max: 5000 },
]), async (req, res, next) => {
  const chatStart = Date.now();
  try {
    const { message, context } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    const response = await getAiCoachResponse(message.trim(), context, req.user);
    aiUsage.increment(true, Date.now() - chatStart);
    res.json({ success: true, data: response });
} catch (e) {
    aiUsage.increment(false, Date.now() - chatStart);
    console.error('[AI Coach] Unhandled error:', e.message);
    console.error('[AI Coach] Stack:', e.stack);
    res.status(500).json({
      success: false,
      message: 'AI chat error',
      data: {
        text: "I'm here to help! Based on your preparation data, focus on completing your weak subjects and solving PYQs daily. What specific topic would you like advice on?",
        suggestions: ["What should I study today?", "Show my weak topics", "How to improve accuracy?"]
      }
    });
  }
});

function buildHeuristicAnalysis(data) {
  const { subjects = [], topics = [], pyqs = [], mocks = [], studyStats = {} } = data;
  const overallProgress = data.overall?.percentage || 0;
  
  // 1. Rank & Score Prediction (Simplified Heuristic)
  // Base score depends on progress and mock average
  const mockAvg = mocks.length > 0 ? mocks.reduce((a, b) => a + (b.score || 0), 0) / mocks.length : 0;
  const pyqAccuracy = pyqs.length > 0 ? (pyqs.filter(p => p.status === 'correct').length / pyqs.length) * 100 : 0;
  
  const predictedScore = Math.min(100, Math.max(0, (overallProgress * 0.4) + (mockAvg * 0.4) + (pyqAccuracy * 0.2)));
  
  // Simplified Rank formula: rank = 10^((100-score)/20)
  const predictedRank = Math.round(Math.pow(10, (100 - predictedScore) / 25) * 100);

  // 2. Health Scores
  const consistency = Math.min(100, (studyStats.weeklyHours?.filter(h => h > 0).length / 7) * 100 || 0);
  const revisionHealth = Math.min(100, (pyqs.filter(p => !p.revisionNeeded).length / (pyqs.length || 1)) * 100);
  
  return {
    scores: {
      mentor: Math.round((predictedScore + consistency) / 2),
      readiness: Math.round(predictedScore),
      consistency: Math.round(consistency),
      revisionHealth: Math.round(revisionHealth),
      mockPerformance: Math.round(mockAvg)
    },
    predictions: {
      score: Math.round(predictedScore),
      rank: predictedRank,
      admissions: predictedScore > 70 ? 'High chance for Top IITs' : predictedScore > 50 ? 'Good chance for NITs' : 'Focus on core subjects'
    },
    riskLevel: consistency < 40 ? 'High' : consistency < 70 ? 'Medium' : 'Low'
  };
}

// ─── Local GATE Coach (no API key needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€───
// Scoring system: each group has specific keywords. The group with the most
// keyword matches wins, avoiding the ordering bug where a generic group
// (e.g., STUDY) catches queries meant for a more specific group.
const GROUPS = [
  { name: 'HELLO', keywords: ['hello', 'hi ', 'hey'], priority: 100 },
  { name: 'DSA', keywords: ['dsa', 'data structure', 'algorithm', 'sorting', 'graph', 'tree', 'dp'], priority: 90 },
  { name: 'OS', keywords: ['os', 'operating system', 'process', 'memory', 'scheduling', 'deadlock', 'sync'], priority: 90 },
  { name: 'DBMS', keywords: ['dbms', 'sql', 'normalization', 'transaction', 'b+ tree', 'indexing'], priority: 90 },
  { name: 'CN', keywords: ['cn', 'network', 'tcp', 'ip', 'routing', 'osi', 'http', 'dns'], priority: 90 },
  { name: 'TOC', keywords: ['toc', 'automata', 'regular', 'context-free', 'turing', 'pda', 'cfg'], priority: 90 },
  { name: 'COA', keywords: ['coa', 'computer organiz', 'architecture', 'pipeline', 'cache', 'hazard'], priority: 90 },
  { name: 'MATH', keywords: ['math', 'mathematics', 'aptitude', 'quant', 'discrete', 'probability'], priority: 90 },
  { name: 'MISTAKE', keywords: ['mistake', 'error', 'accuracy', 'wrong', 'incorrect', 'silly'], priority: 85 },
  { name: 'TRACK', keywords: ['on track', 'progress', 'behind', 'pace', 'ahead'], priority: 85 },
  { name: 'REVISE', keywords: ['revision', 'revise', 'review', 'spaced', 'recall', 'forgot'], priority: 80 },
  { name: 'WEAK', keywords: ['weak', 'weakness', 'struggling', 'difficult', 'improve'], priority: 80 },
  { name: 'MOCK', keywords: ['mock', 'test', 'practice', 'score', 'marks', 'exam'], priority: 80 },
  { name: 'PYQ', keywords: ['pyq', 'previous year', 'question bank', 'gate paper'], priority: 80 },
  { name: 'RANK', keywords: ['rank', 'air', 'college', 'iit', 'nit', 'admission'], priority: 75 },
  { name: 'FORMULA', keywords: ['formula', 'short note', 'crib', 'cheat sheet'], priority: 75 },
  { name: 'RESOURCE', keywords: ['resource', 'book', 'reference', 'channel', 'course', 'lecture'], priority: 75 },
  { name: 'MOTIVE', keywords: ['motivat', 'inspire', 'tired', 'burnout', 'bored', 'give up'], priority: 75 },
  { name: 'TIME', keywords: ['time', 'manage', 'hours', 'routine', 'daily', 'pomodoro'], priority: 70 },
  { name: 'SUBJECT', keywords: ['subject', 'topic', 'syllabus', 'priority', 'weightage'], priority: 70 },
  { name: 'STUDY', keywords: ['plan', 'schedule', 'today', 'daily', 'week'], priority: 60 },
];

function findBestGroup(msg) {
  const lower = msg.toLowerCase();
  let best = { name: 'GENERIC', score: 0, priority: 0 };

  for (const group of GROUPS) {
    let score = 0;
    for (const kw of group.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > 0 && (score > best.score || (score === best.score && group.priority > best.priority))) {
      best = { name: group.name, score, priority: group.priority };
    }
  }
  return best.name;
}

function localCoachResponse(message, context) {
  const msg = message.toLowerCase();
  const weakSub = context.weakSubjects?.length ? context.weakSubjects[0] : 'your weak areas';
  const strongSub = context.strongSubjects?.length ? context.strongSubjects[0] : 'your strong subjects';
  const progress = context.overallProgress || 0;
  const avg = context.mockAvg || 0;
  const streak = context.streak || 0;

  let text = '';
  let suggestions = ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"];

  const bestGroup = findBestGroup(msg);

  if (bestGroup === 'HELLO') {
    text = `Hey there, GATE warrior! 👋 Ready to crush it today. ${
      streak > 0 ? `You're on a ${streak}-day streak — that's solid discipline!` : 'Consistency is key — let\'s build that streak.'
    } I'm here to help with study plans, topic advice, revision tips, or anything GATE-related. What do you need?`;
    suggestions = ["Plan my study day", "Show my weak topics", "How should I revise?"];
  } else if (bestGroup === 'STUDY') {
    text = `Here's your daily focus plan:\n\n${progress > 50 ? '📗 You\'re past halfway — great momentum!' : '📘 Starting strong — every hour counts!'}\n\n**Morning (2h):** ${weakSub} — focus on concept clarity + 5 PYQs\n**Afternoon (1.5h):** ${strongSub} — reinforce your strength area\n**Evening (1h):** Revision of last week's topics\n**Night (30m):** Formula sheet review + plan tomorrow\n\nStay consistent, and you'll see results every week! 🚀`;
    suggestions = ["Which topics in " + weakSub + " should I focus?", "How many PYQs should I solve daily?", "Give me a weekly study plan"];
  } else if (bestGroup === 'WEAK') {
    text = `Your current weak areas are: **${weakSub}** (${context.weakTopics?.slice(0,3)?.join(', ') || 'core topics'}).\n\nHere's a targeted attack plan:\n1. **Watch 1 good NPTEL/YouTube lecture** on the foundational concepts\n2. **Solve 10 PYQs** from the last 5 years on this subject\n3. **Create a one-page formula sheet** for quick revision\n\nDedicate 2 hours daily to ${weakSub} for the next 5 days and you'll see a clear improvement!`;
    suggestions = ["Show subject-wise progress", "Which PYQs should I solve first?", "Create a weekly plan for " + weakSub];
  } else if (bestGroup === 'REVISE') {
    text = `Spaced repetition is your secret weapon! 🧠\n\n${context.overdueTopics > 0 ? `⚠️ You have **${context.overdueTopics} topics** overdue for revision. Let's fix that!` : '✅ You\'re up to date on revisions — great habit!'}\n\n**Quick revision plan:**\n1. Revise **3 old topics** daily (30 min each)\n2. Use your short notes + formula sheets\n3. Solve **5 PYQs** from each topic to test retention\n4. Mark topics as done in the revision scheduler\n\nStart with the oldest unreviewed topic first!`;
    suggestions = ["Show my revision schedule", "Which topics are due today?", "How does spaced repetition work?"];
  } else if (bestGroup === 'MOCK') {
    text = avg === 0 
      ? `You haven't taken any mock tests yet! 🧪\n\nMocks are **critical** for GATE success. Start with:\n1. **Subject-wise mock** for your strongest subject (to build confidence)\n2. **Full-length mock** every Sunday\n3. **Analyze every mistake** — create an error log\n\nWant me to suggest a mock test plan?`
      : `Your average mock score is **${avg}%**. ${avg >= 60 ? '✅ Solid! Focus on converting 60s to 80s.' : avg >= 40 ? '📈 Improving — analyze your mistake patterns.' : '🎯 Early stage — focus on concept clarity first.'}\n\n**Mock strategy:**\n- Take 1 full-length mock every week\n- Spend **equal time analyzing** as taking the test\n- Track your per-subject accuracy to find patterns\n- Re-solve mistakes after 3 days`;
    suggestions = ["Suggest a mock test", "How to analyze mock results?", "What's a good GATE score?"];
  } else if (bestGroup === 'MOTIVE') {
    text = `Stay strong, GATE aspirant! 💪\n\nRemember why you started. Every hour you put in is an investment in your future. **Small daily wins compound into extraordinary results.**\n\nQuick reset tips:\n1. Take a 15-min break — walk, stretch, breathe\n2. Review your "why" — IIT, PSU, or your dream role\n3. Set **one small goal** for the next 30 minutes\n4. Celebrate small wins — completed a topic? Mark it!\n\nYou're not alone in this journey. Keep going! 🔥`;
    suggestions = ["Plan a lighter study day", "How to avoid burnout?", "Celebrate my progress so far"];
  } else if (bestGroup === 'TIME') {
    text = `Quality > Quantity. Here's an optimized routine:\n\n🌅 **Morning (2h):** Deep focus — new concepts (highest concentration)\n🌤️ **Afternoon (1.5h):** PYQ practice + problem solving\n🌆 **Evening (1.5h):** Revision + weak area attack\n🌙 **Night (30m):** Formula review + plan next day\n\n💡 **Pro tip:** Use Pomodoro: 50 min study + 10 min break. Track your hours in the Productivity page!`;
    suggestions = ["How many hours should I study?", "Best study techniques for GATE", "How to avoid distractions?"];
  } else if (bestGroup === 'SUBJECT') {
    text = `**Priority order for GATE CSE:**\n\n🥇 **High weightage:** DSA, Algorithms, OS, DBMS, CN\n🥈 **Medium weightage:** COA, TOC, Discrete Math\n🥉 **Foundation:** Mathematics, Aptitude\n\nYour current order should be:\n1. Cover **Mathematics + Aptitude** early (they boost scores)\n2. **DSA + OS + DBMS** — most questions come from here\n3. **CN + TOC + COA** — moderate weightage, don't skip\n4. **Revision + Mocks** — keep revisiting completed subjects\n\nFocus on **completing one subject at a time** rather than jumping between them.`;
    suggestions = ["Subject-wise weightage breakdown", "Which subject to start first?", "How much time per subject?"];
  } else if (bestGroup === 'PYQ') {
    text = `PYQs are the **gold mine** of GATE preparation! 🏆\n\n**Strategy:**\n1. Solve PYQs **subject-wise** first (after completing each subject)\n2. Then solve **year-wise** as full-length tests\n3. **Revise your mistakes** after 3 days and again after 7 days\n4. Aim for **90%+ accuracy** on 2020-2024 papers\n\n💡 **Tip:** PYQs from 2015-2024 cover almost all important concepts. Solve them at least twice!`;
    suggestions = ["Show PYQ browser", "Most repeated PYQ topics", "How to analyze PYQ mistakes?"];
  } else if (bestGroup === 'FORMULA') {
    text = `Short notes + Formula sheets = **Revision superpower** 📝\n\n**How to create effective formula sheets:**\n1. One page per subject — only formulas, definitions, key points\n2. Use colors for different categories (green = easy, yellow = moderate, red = tricky)\n3. Keep updating as you learn new topics\n4. Review them **daily** — 5 minutes before starting study\n\n✅ Already have notes? Great! Just opening them daily reinforces memory.`;
    suggestions = ["Show my formula sheets", "How to make effective notes?", "Show revision notes for OS"];
  } else if (bestGroup === 'MISTAKE') {
    text = `Mistakes are **learning opportunities** in disguise! 🔍\n\n${context.recentAccuracy > 0 ? `Your current accuracy is **${context.recentAccuracy}%**.` : ''}\n\n**Mistake analysis framework:**\n1. **Categorize** each mistake: Silly / Concept Gap / Reading Error\n2. **Fix concept gaps** by re-watching lectures or reading textbooks\n3. **Re-solve** the question after 3 days (spaced repetition!)\n4. **Track patterns** — if you keep making the same type of error, drill it\n\nYour Mistake Notebook is the best tool — use it after every practice session!`;
    suggestions = ["Open Mistake Notebook", "How to avoid silly mistakes?", "Analyze my mistake patterns"];
  } else if (bestGroup === 'RANK') {
    text = `**GATE Score → Rank estimates (general category):**\n\n🏆 **AIR < 100:** 75+ marks (IIT Bombay/Delhi CSE)\n🥇 **AIR < 500:** 65+ marks (Top IITs)\n🥈 **AIR < 2000:** 55+ marks (IITs, NITs)\n🥉 **AIR < 5000:** 45+ marks (Good NITs, IIITs)\n\n**Your current path:** ${progress > 70 ? 'You\'re on track for a strong rank!' : progress > 40 ? 'Good progress — keep building!' : 'Early stage — focus on learning, not ranks yet!'}\n\nYou can track your predicted rank in the Analytics page!`;
    suggestions = ["Predict my AIR", "Show college cutoffs", "What score for IIT Madras?"];
  } else if (bestGroup === 'RESOURCE') {
    text = `**Best free resources for GATE CSE:**\n\n📺 **YouTube:** NPTEL (IIT professors), Gate Smashers, Knowledge Gate\n📘 **Books:** CLRS (Algorithms), Tanenbaum (OS/CN), Korth (DBMS), Ullman (TOC)\n🧠 **Practice:** GateNexa PYQ browser + Mock tests\n📝 **Notes:** Create your own short notes (10-15 pages per subject)\n\n💡 **Rule:** Stick to **1-2 resources per subject**. Hoarding resources wastes time!`;
    suggestions = ["Best YouTube channels", "Recommended textbooks", "Free mock test sources"];
  } else if (bestGroup === 'MATH') {
    text = `**Mathematics for GATE CSE — Priority order:**\n\n1. **Discrete Mathematics** — Graph Theory, Combinatorics, Set Theory (highest weightage)\n2. **Linear Algebra** — Matrices, Vector Spaces, Eigenvalues\n3. **Probability & Statistics** — Random Variables, Distributions\n4. **Calculus** — Limits, Continuity, Differentiation\n\n📈 **Strategy:** Solve **5 math problems daily** — consistency matters more than intensity. Most math questions in GATE are moderate difficulty but need practice.`;
    suggestions = ["Discrete Math topics", "Probability PYQs", "Linear Algebra weightage"];
  } else if (bestGroup === 'DSA') {
    text = `**DSA for GATE — high weightage subject!** ⚡\n\nKey topics: Arrays, Linked Lists, Trees, Graphs, Sorting & Searching, Hashing, Dynamic Programming, Greedy Algorithms.\n\n**Study plan:**\n1. Master **arrays + linked lists** first (building blocks)\n2. **Trees + Graphs** — most GATE questions come from these\n3. **Sorting + Searching** — know time/space complexities cold\n4. **DP + Greedy** — practice 5+ problems per concept\n\nSolve **10 DSA PYQs weekly** and track your accuracy!`;
    suggestions = ["DSA PYQs by topic", "Graph algorithms weightage", "How to master DP for GATE?"];
  } else if (bestGroup === 'OS') {
    text = `**Operating Systems — core subject for GATE!** 💻\n\nKey topics: Processes & Threads, CPU Scheduling, Synchronization, Deadlocks, Memory Management, File Systems, I/O.\n\n**Study plan:**\n1. **Process management + Scheduling** — most numericals come from here\n2. **Memory management** — paging, segmentation, virtual memory\n3. **Synchronization + Deadlocks** — critical for GATE\n4. **File systems + I/O** — moderate weightage\n\nSolve **OS PYQs from the last 10 years** — patterns repeat frequently!`;
    suggestions = ["OS scheduling numericals", "Memory management PYQs", "Deadlock practice questions"];
  } else if (bestGroup === 'DBMS') {
    text = `**DBMS — high-weightage, high-reward subject!** 🗄️\n\nKey topics: ER Model, Relational Model, SQL, Normalization, Transactions, Concurrency Control, Indexing.\n\n**Study plan:**\n1. **SQL + Relational Algebra** — practice writing queries daily\n2. **Normalization** — know 1NF through BCNF with examples\n3. **Transactions + Concurrency** — ACID, schedules, locking protocols\n4. **Indexing** — B+ trees, hash-based indexing\n\nSQL questions are free marks — practice until perfect!`;
    suggestions = ["SQL practice questions", "Normalization exercises", "Transaction PYQs"];
  } else if (bestGroup === 'CN') {
    text = `**Computer Networks — moderate weightage, manageable scope!** 🌐\n\nKey topics: OSI/TCP-IP Model, Application Layer (HTTP, DNS), Transport Layer (TCP, UDP), Network Layer (IP, Routing), Data Link Layer.\n\n**Study plan:**\n1. **TCP/IP model + layers** — know what each layer does\n2. **TCP + UDP** — congestion control, flow control\n3. **IP addressing + Routing** — subnetting, CIDR, routing algorithms\n4. **Application layer** — HTTP, DNS, SMTP basics\n\nFocus on **numericals** — IP addressing and TCP flow control are GATE favorites!`;
    suggestions = ["IP addressing numericals", "TCP congestion control", "Routing algorithm PYQs"];
  } else if (bestGroup === 'TOC') {
    text = `**Theory of Computation — conceptual but scoring!** 🔤\n\nKey topics: Regular Languages, DFA/NFA, Regular Expressions, Context-Free Grammars, Pushdown Automata, Turing Machines, Undecidability.\n\n**Study plan:**\n1. **DFA/NFA design** — practice constructing automata for languages\n2. **Regular expressions** — conversion to/from automata\n3. **CFG + PDA** — derivations, parse trees, pushdown automata\n4. **Turing Machines + Undecidability** — understand concepts, not memorize\n\nTOC is a **high-confidence scoring subject** — consistent practice yields full marks!`;
    suggestions = ["DFA practice problems", "CFG to PDA conversion", "Turing machine basics"];
  } else if (bestGroup === 'COA') {
    text = `**Computer Organization & Architecture — must-know!** ⚙️\n\nKey topics: Number Systems, Boolean Algebra, Combinational/Sequential Circuits, CPU Architecture, Pipelining, Memory Hierarchy, Cache, I/O.\n\n**Study plan:**\n1. **Digital Logic (Number systems + Boolean)** — foundation for COA\n2. **CPU Architecture + Pipelining** — most numericals here\n3. **Cache + Memory Hierarchy** — know mapping techniques\n4. **I/O + DMA** — basic understanding enough\n\nCOA numericals (cache, pipeline) are **free marks** with enough practice!`;
    suggestions = ["Pipeline numericals", "Cache mapping techniques", "COA PYQs by topic"];
  } else if (bestGroup === 'TRACK') {
    text = `**Am I on track? Let's check!** 📊\n\n${progress > 70 ? '✅ **Excellent progress!** You\'re well ahead. Focus on revision + mock tests.' : progress > 50 ? '✅ **Good progress!** Keep up the momentum. Start PYQs for completed subjects.' : progress > 30 ? '⚠️ **On track, but can accelerate!** Increase daily study hours and prioritize weak subjects.' : '🔴 **Early stage — this is okay!** Focus on covering core subjects (DSA, OS, DBMS) first.'}\n\n🎯 **Suggested daily targets:**\n- ${progress < 30 ? '4-5 hours: 2h new content + 2h practice + 1h revision' : progress < 60 ? '5-6 hours: 2h new + 2h PYQs + 1.5h revision + 0.5h planning' : '5-6 hours: 3h PYQs/mocks + 2h revision + 1h weak area attack'}\n\n🔥 ${streak > 0 ? `Your ${streak}-day streak is solid!` : 'Start a streak today!'}`;
    suggestions = ["Weekly study plan", "How many hours should I study?", "Adjust my preparation strategy"];
  } else {
    text = `Great question! Based on your GATE preparation context:\n\n📊 **Progress:** ${progress}% complete\n🎯 **Mock Average:** ${avg > 0 ? avg + '%' : 'Not yet started'}\n🔥 **Streak:** ${streak} days\n📚 **Weak subjects:** ${weakSub}\n✅ **Strong subjects:** ${strongSub}\n\n**My advice:** ${progress < 30 ? 'Focus on completing core subjects first — DSA, OS, DBMS. Take it one chapter at a time!' : progress < 60 ? 'Great progress! Now shift focus to PYQs and mock tests alongside learning.' : 'Excellent! You\'re in the revision + mock phase now. Prioritize mock analysis and weak area attacks.'}\n\nLet me know what specific aspect you'd like to dive deeper into! 🚀`;
    suggestions = ["What should I study today?", "Am I on track for GATE 2027?", "Create a weekly study plan"];
  }

  return { text, suggestions };
}

async function getAiCoachResponse(message, context, user) {
  console.log('[AI Coach] Starting getAiCoachResponse');
  console.log('[AI Coach] User message:', message);
  console.log('[AI Coach] Context:', JSON.stringify(context, null, 2));
  context = context || {};
  
  // Log API key presence (not the actual key!)
  console.log('[AI Coach] OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
  console.log('[AI Coach] DASHSCOPE_API_KEY present:', !!process.env.DASHSCOPE_API_KEY);
  console.log('[AI Coach] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

try {
    lastAiError = null; // Clear stale errors at start of each request
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      console.log('[AI Coach] API key found, calling callAiApi...');
      lastAiError = null;
      
      const systemPrompt = `You are GateNexa AI Mentor — a senior GATE CSE preparation coach.

Student context:
- Overall progress: ${context.overallProgress || 0}%
- Mock average: ${context.mockAvg || 0}%
- Weak subjects: ${(context.weakSubjects || []).join(', ') || 'none'}
- Strong subjects: ${(context.strongSubjects || []).join(', ') || 'none'}
- Weak topics: ${(context.weakTopics || []).slice(0, 5).join(', ') || 'none'}
- Study streak: ${context.streak || 0} days
- Overdue revisions: ${context.overdueTopics || 0}
- Recent accuracy: ${context.recentAccuracy || 0}%

Rules:
- Stay within GATE CSE scope (DSA, OS, DBMS, CN, TOC, COA, Engineering Math, Aptitude)
- Reference the student's actual data (weak subjects, mock scores, streak) in every response
- Be specific: give subject names, topic names, concrete hour allocations
- Keep responses under 200 words unless the user asks for detail
- Use markdown formatting (bold, bullet points, numbered lists)
- Always end with a follow-up question or actionable next step

Example interactions:

User: "What should I study today?"
Assistant: "Based on your weak areas, here's today's plan:
**1. ${context.weakSubjects?.[0] || 'Your weakest subject'} (2 hours)** — Focus on ${context.weakTopics?.[0] || 'key weak topics'}. This is a high-weightage GATE area.
**2. PYQ Practice (1 hour)** — Solve 10 previous year questions from any subject.
**3. Revision (30 min)** — Review flashcards for formulas.
You're on a **${context.streak || 0}-day streak** — keep it going! What subject do you want to start with?"

User: "I scored 45% in my last mock"
Assistant: "45% is a **starting point**, not a ceiling. Here's what I see:
- Your **weak subjects** are dragging your score down
- Focus on **PYQ accuracy** — it directly impacts your predicted rank
- Take **2 more subject-wise mocks** this week before attempting another full-length
Target: **55% in your next mock** by improving your weakest 2 subjects. Want me to create a study plan?"

User: "Explain DBMS normalization"
Assistant: "Here's a quick GATE-focused breakdown of **Normalization**:
- **1NF**: No repeating groups, atomic values
- **2NF**: 1NF + no partial dependency (all non-key depend on full primary key)
- **3NF**: 2NF + no transitive dependency
- **BCNF**: Every determinant is a candidate key

**GATE Trick**: If a question gives a relation with composite primary key, check for partial dependency first — that's the most tested concept.

Want me to walk through a specific GATE PYQ on normalization?"`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(context.history) ? context.history.slice(-6) : []),
        { role: 'user', content: message },
      ];

      const text = await callAiApi(messages, { max_tokens: 800, temperature: 0.7 });

      console.log('[AI Coach] callAiApi returned:', text?.substring(0, 100));

      if (text) {
        const lower = text.toLowerCase();
        const generic = ['i am an ai', 'i cannot', "i don't have access", 'as an ai', 'i apologize'];
        if (!generic.some(g => lower.includes(g))) {
          console.log('[AI Coach] Returning real AI response');
          lastAiError = null;
          return { text, suggestions: ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"] };
        } else {
          console.log('[AI Coach] AI response contained generic phrases, falling back');
          lastAiError = 'AI returned generic response';
        }
      } else {
        console.log('[AI Coach] callAiApi returned null/empty, keep lastAiError set by callAiApi');
      }
    } else {
      console.log('[AI Coach] No API key found, falling back');
      lastAiError = 'No OpenRouter API key configured';
    }
  } catch (e) {
    console.error('[AI Coach] API call failed, using local fallback:', e.message);
    console.error('[AI Coach] Stack trace:', e.stack);
    if (!lastAiError) {
      lastAiError = `AI call failed: ${e.message}`;
    }
  }

  // If we have an error, show it instead of always returning the same canned response
  if (lastAiError) {
    return { 
      text: `⚠️ **AI Mentor Error**: ${lastAiError}\n\nPlease set a valid OPENROUTER_API_KEY in your project root .env file to use real AI responses! You can get your key at https://openrouter.ai/keys`,
      suggestions: ["What should I study today?", "Am I on track?", "Show my weak topics"]
    };
  }

  // Fallback to local heuristic coach
  try {
    console.log('[AI Coach] Using localCoachResponse');
    return localCoachResponse(message, context);
  } catch (e) {
    console.error('[AI Coach] localCoachResponse threw:', e.message);
    return { 
      text: "I can help with your GATE preparation! Focus on core subjects: DSA, OS, DBMS, and CN. Solve PYQs daily and revise regularly. What would you like to know?",
      suggestions: ["What should I study today?", "Am I on track?", "Show my weak topics"]
    };
  }
}

async function buildGptAnalysis(data) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a GATE CSE 2027 AI Mentor. Analyze the following student data and return a JSON object.

Return EXACTLY this JSON structure (no markdown, no extra text):
{
  "recommendations": [
    { "type": "next_study", "title": "...", "content": "...", "action": "/topics" },
    { "type": "plan", "title": "...", "content": "...", "action": "/dashboard" }
  ],
  "analysis": {
    "scores": { "mentor": 0-100, "readiness": 0-100, "consistency": 0-100, "revisionHealth": 0-100, "mockPerformance": 0-100 },
    "predictions": { "score": 0-100, "rank": 0, "admissions": "..." },
    "riskLevel": "Low|Medium|High"
  }
}

Data:
- Subjects: ${JSON.stringify(data.subjects?.map(s => ({ name: s.name, progress: s.progress })) || [])}
- Recent Mocks: ${JSON.stringify(data.mocks?.slice(-5) || [])}
- Streak: ${data.gateFeatures?.streak?.current || 0}
- Total Progress: ${data.overall?.percentage || 0}%
- Study Hours (Mon-Sun): ${JSON.stringify(data.studyStats?.weeklyHours || [])}

Categories to cover: next_study, revision, weak_area, mock_test, insight, health, readiness, plan, mistake_analysis.
Provide specific, motivating, GATE-focused advice.`;

  const messages = [
    { role: 'system', content: 'You output only valid JSON for GATE mentorship analysis.' },
    { role: 'user', content: prompt },
  ];

  try {
    const text = await callAiApi(messages, { max_tokens: 2000, response_format: { type: 'json_object' } });
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('buildGptAnalysis error:', e.message);
    return null;
  }
}

// ─── Doubt Solver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€───

const DOUBT_SUBJECTS = ['AL', 'DS', 'DB', 'OS', 'CN', 'CO', 'TOC', 'CD', 'DL', 'EM', 'APT'];

function buildHeuristicDoubtResponse(doubt, subject, topic) {
  const subj = subject || 'Computer Science';
  const topicStr = topic || 'general';

  const explanation = `Let's break down this ${subj} doubt step by step.

This question relates to ${topicStr} in ${subj}. The key concept here involves understanding the fundamental principles that govern this topic.

**Core Idea:**
In ${subj}, ${topicStr} deals with the interaction between theoretical concepts and practical implementation. The solution approach depends on identifying the right principle to apply.

**Why this matters for GATE:**
Questions on ${topicStr} appear frequently in GATE CSE papers (typically 2-3 questions worth 4-6 marks). Mastering this will boost your score significantly.`;

  const steps = [
    { title: 'Identify the Core Concept', content: `Read the problem carefully to identify which core concept in ${topicStr} it tests. Look for keywords and patterns.` },
    { title: 'Recall Key Principles', content: `Recall the fundamental theorems and properties related to this topic. Write down any formulas that might apply.` },
    { title: 'Apply Step-by-Step', content: `Work through the problem methodically. Start with what you know and build toward the solution.` },
    { title: 'Verify Your Answer', content: `Check your solution against known edge cases. Does it hold for all inputs? Are there any assumptions you made that could be invalid?` },
  ];

  const keyTakeaways = [
    `Focus on understanding the "why" behind ${topicStr} — GATE rewards conceptual clarity over rote memorization.`,
    `Practice at least 10-15 PYQs on this topic to solidify the approach.`,
    `Create a one-page formula sheet for ${topicStr} covering all key results.`,
  ];

  const answers = [
    { q: `What are the prerequisites for ${topicStr}?`, a: `Strong understanding of basic ${subj} concepts, mathematical foundations, and problem-solving skills.` },
    { q: `Common mistakes in ${topicStr}`, a: `Students often confuse similar-looking concepts. Always draw diagrams/tables to compare and contrast.` },
    { q: `Best resources for ${topicStr}`, a: `Standard textbooks, NPTEL lectures, and previous year GATE questions are your best bet.` },
  ];

  const relatedTopics = [
    { name: `${topicStr} — Advanced`, description: `Deep dive into advanced concepts` },
    { name: `${topicStr} PYQs`, description: `Practice previous year questions` },
    { name: `Formula Sheet`, description: `Quick reference for ${topicStr}` },
  ];

  return { explanation, steps, keyTakeaways, answers, relatedTopics, confidence: 'medium' };
}

async function buildAiDoubtResponse(doubt, subject, topic) {
  const subj = subject || 'Computer Science';
  const topicStr = topic || 'general';

  const prompt = `You are a GATE CSE expert tutor. A student has a doubt about "${doubt}" in the subject "${subj}" (topic: "${topicStr}").

Provide a comprehensive, structured response as a JSON object (no markdown, no extra text):

{
  "explanation": "A clear, detailed explanation of the concept and the doubt. Use markdown for formatting, include examples.",
  "steps": [
    { "title": "Step 1 name", "content": "Detailed instruction for step 1" },
    { "title": "Step 2 name", "content": "Detailed instruction for step 2" }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "answers": [
    { "q": "Follow-up question 1", "a": "Answer 1" },
    { "q": "Follow-up question 2", "a": "Answer 2" }
  ],
  "relatedTopics": [
    { "name": "Topic name", "description": "Brief description" }
  ]
}

Make it highly specific to the student's doubt and GATE CSE. Include concrete examples, formulas, and GATE-level insights. The explanation should be thorough but accessible. Target 3-5 steps.`;

  const messages = [
    { role: 'system', content: 'You are a GATE CSE expert tutor. Output only valid JSON.' },
    { role: 'user', content: prompt },
  ];

  try {
    const text = await callAiApi(messages, { max_tokens: 2500, temperature: 0.5, response_format: { type: 'json_object' } });
    if (!text) return null;

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('AI Doubt Solver Error:', e.message);
    return null;
  }
}

router.post('/doubt-solver', protect, validateFields([
  { name: 'doubt', type: 'string', required: true, min: 3, max: 2000 },
]), async (req, res, next) => {
  const doubtStart = Date.now();
  try {
    const { doubt, subject, topic } = req.body;

    let response;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Using expert-crafted explanations instead.';
      } else {
        response = await buildAiDoubtResponse(doubt.trim(), subject, topic);
        if (response?.explanation) {
          source = 'ai';
        } else {
          aiError = 'AI returned empty response. Using expert-crafted explanation.';
        }
      }
    } catch (e) {
      aiError = `AI request failed: ${e.message}. Using expert-crafted explanation.`;
    }

    if (!response?.explanation) {
      response = buildHeuristicDoubtResponse(doubt.trim(), subject, topic);
    }

    aiUsage.increment(true, Date.now() - doubtStart);
    res.json({ success: true, data: { ...response, source, aiError, doubt } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - doubtStart);
    next(e);
  }
});

// ─── Subject list for doubt solver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€───
router.get('/doubt-subjects', protect, (req, res, next) => {
  try {
    res.json({ success: true, data: DOUBT_SUBJECTS });
  } catch (e) { next(e); }
});

module.exports = router;

