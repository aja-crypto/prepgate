// src/routes/resources.js — Backend-managed resource browsing + AI search

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { searchResources, getSubjects, getBySubject, getIndex } = require('../services/resourceScanner');

const RESOURCES_DIR = path.join(__dirname, '../..', 'resources');

// Serve PDF files from /resources folder
router.get('/file/:path(*)', protect, (req, res) => {
  const filePath = path.join(RESOURCES_DIR, req.params.path);
  if (!filePath.startsWith(RESOURCES_DIR)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  res.sendFile(filePath);
});

// List all subjects
router.get('/subjects', protect, (req, res) => {
  res.json({ success: true, data: getSubjects() });
});

// List resources by subject
router.get('/subject/:subject', protect, (req, res) => {
  const resources = getBySubject(req.params.subject);
  res.json({ success: true, count: resources.length, data: resources });
});

// Get complete index
router.get('/index', protect, (req, res) => {
  res.json({ success: true, count: getIndex().length, data: getIndex() });
});

// AI search
router.post('/ai-search', protect, (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  const results = searchResources(query);
  
  // Build categorized response
  const categorized = {};
  results.forEach(r => {
    if (!categorized[r.subject]) categorized[r.subject] = [];
    categorized[r.subject].push(r);
  });

  // Build smart reply
  let reply = '';
  if (results.length > 0) {
    const subjects = Object.keys(categorized);
    reply = `✅ Found **${results.length}** resource${results.length > 1 ? 's' : ''}`;
    if (subjects.length === 1) {
      reply += ` in **${subjects[0]}**`;
    }
    reply += '.\n\n';
    subjects.forEach(s => {
      reply += `**${s}**\n`;
      categorized[s].slice(0, 3).forEach(r => {
        reply += `  └── ${r.title}\n`;
      });
      if (categorized[s].length > 3) {
        reply += `  └── +${categorized[s].length - 3} more\n`;
      }
      reply += '\n';
    });
  } else {
    reply = `I couldn't find any resources matching "${query}". Resources are added by the platform — check back later or try a different topic.`;
  }

  // Extract matched subjects for suggestions
  const matchedSubjects = Object.keys(categorized);
  const suggestions = [];
  matchedSubjects.forEach(s => {
    const related = getSubjects().filter(sub => sub !== s);
    suggestions.push(...related.slice(0, 2));
  });

  res.json({
    success: true,
    data: {
      reply,
      query,
      total: results.length,
      categorized,
      all: results,
      suggestions: [...new Set(suggestions)].slice(0, 4),
    }
  });
});

module.exports = router;