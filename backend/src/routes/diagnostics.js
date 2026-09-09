const router = require('express').Router();
const { isMongoConnected } = require('../config/db');

function hasAiConfig() {
  return !!(process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY);
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      service: 'GATE 2027 API',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      mongoConnected: isMongoConnected(),
      aiConfigured: hasAiConfig(),
      aiReachable: true,
      version: '1.0.0',
    },
  });
});

router.get('/ai/health', (req, res) => {
  const configured = hasAiConfig();
  res.json({
    success: true,
    data: {
      aiConfigured: configured,
      aiReachable: true,
      status: configured ? 'configured' : 'not_configured',
      message: configured ? 'AI route reachable and provider configured (operational check requires authenticated request)' : 'AI route reachable but no provider configured — heuristic fallback will be used',
    },
  });
});

router.get('/diagnostics/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      service: 'GATE 2027 API',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      mongoConnected: isMongoConnected(),
      aiConfigured: hasAiConfig(),
      aiReachable: true,
      version: '1.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  });
});

module.exports = router;
