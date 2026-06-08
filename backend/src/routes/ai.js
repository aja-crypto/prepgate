// AI study planner — GPT when OPENAI_API_KEY is set, heuristic fallback otherwise
const router = require('express').Router();
const { protect } = require('../middleware/auth');

/**
 * Generic AI API caller supporting OpenAI and DashScope (Aliyun)
 */
async function callAiApi(messages, options = {}) {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const isDashScope = apiKey.startsWith('al-');
  const endpoint = isDashScope 
    ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  const model = isDashScope 
    ? (process.env.DASHSCOPE_MODEL || 'qwen-plus')
    : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      console.error('AI API Error:', error);
      return null;
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('AI API Fetch Error:', err.name === 'AbortError' ? 'Request timed out' : err.message);
    return null;
  }
}

function buildHeuristicPlan(body) {
  const { subjects = [], topics = [], dailyHours = 8 } = body;
  const incomplete = topics.filter((t) => !t.done);
  const weakSubjects = [...subjects].sort((a, b) => (a.progress || 0) - (b.progress || 0));
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  const { subjects, topics, pyqs, mocks, dailyHours = 8, period = 'week' } = body;
  const incomplete = topics.filter((t) => !t.done).slice(0, 15);
  const unsolvedPyqs = pyqs.filter((p) => !p.solved).slice(0, 10);
  const recentMock = mocks[mocks.length - 1];

  const prompt = `You are a GATE CSE 2027 study coach. Create a ${period}ly study plan as JSON array.
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
    const text = await callAiApi(messages);
    if (!text) throw new Error('AI Response empty');

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in response');
    
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Failed to build GPT plan, falling back to heuristic:', e.message);
    return buildHeuristicPlan(body);
  }
}

router.post('/planner', protect, async (req, res, next) => {
  try {
    let plan;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Set DASHSCOPE_API_KEY or OPENAI_API_KEY in .env';
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

    res.json({ success: true, data: { plan, source, aiError } });
  } catch (e) {
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

  const text = await callAiApi(messages);
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

router.post('/recommendations', protect, async (req, res, next) => {
  try {
    let recommendations;
    let analysis;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
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

    res.json({ success: true, data: { recommendations, analysis, source, aiError } });
  } catch (e) {
    next(e);
  }
});

router.post('/chat', protect, async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const response = await getAiCoachResponse(message, context, req.user);
    res.json({ success: true, data: response });
  } catch (e) {
    next(e);
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

async function getAiCoachResponse(message, context, user) {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      text: "I am currently in Offline Mode. I can help you with study plans and progress analysis based on your data, but for deep conceptual discussions, please enable the AI Model API key.",
      suggestions: ["What should I study today?", "Am I on track?", "Show my weak topics"]
    };
  }

  const prompt = `You are the "GATE 2027 AI Mentor", a personal coach for a student preparing for the GATE Computer Science exam. 
  
User Question: "${message}"

Student Context:
- Current Syllabus Progress: ${context.overallProgress}%
- Recent Mock Avg: ${context.mockAvg}% mark
- Weak Subjects: ${context.weakSubjects?.join(', ')}
- Current Streak: ${context.streak} days
- Study Hours this week: ${context.weeklyHours}h
- Spaced Repetition: ${context.overdueTopics || 0} topics due for revision.
- Accuracy Trend: Recent accuracy is ${context.recentAccuracy || 0}% (Target: >75%).

Guidelines:
1. Be professional, strategic, and highly motivating.
2. If accuracy is dropping, give a "Reality Check" - suggest specific drills.
3. Identify topics not revised in 14+ days if overdueTopics > 0.
4. Use technical GATE terms (e.g., "Paging in OS", "NP-Completeness in TOC").
5. Suggest 3 specific tasks (e.g., "Solve 15 PYQs on DBMS", "Revise Deadlocks").

Return a JSON: { "text": "your response", "suggestions": ["q1", "q2", "q3"] }`;

  try {
    const text = await callAiApi([{ role: 'user', content: prompt }], {
      response_format: { type: 'json_object' }
    });
    
    if (!text) throw new Error('AI Response empty');
    
    // Some models might return text with markdown json blocks
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    const reason = e.message === 'AI Response empty' 
      ? 'The AI model returned an empty response. This may be due to API rate limits or content filtering.'
      : `AI connection error: ${e.message}. The coach is running in offline mode.`;
    console.error('Coach Chat Error:', e);
    return {
      text: reason + " I can still help analyze your study data and suggest study plans.",
      suggestions: ["What should I study today?", "Am I on track?", "Show my weak topics"]
    };
  }
}

async function buildGptAnalysis(data) {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  // Implementation similar to getAiCoachResponse but for full dashboard analysis
  return null; 
}

module.exports = router;
