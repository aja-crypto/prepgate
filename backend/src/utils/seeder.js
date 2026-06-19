// Seed MongoDB with complete GATE CSE syllabus + learning content
require('../config/loadEnv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Subject = require('../models/Subject');
const { Topic, PYQ } = require('../models');
const { importRows } = require('../services/pyqImportService');
const { GATE_SYLLABUS, buildTopicDocument } = require('../services/topicContentService');
const SAMPLE_PYQS = require('../data/samplePyqs');

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    await PYQ.deleteMany({});
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    console.log('🗑  Cleared existing data');

    const subjectsToInsert = Object.entries(GATE_SYLLABUS).map(([code, meta]) => ({
      name: meta.name,
      code,
      icon: meta.icon,
      color: meta.color,
      weightage: meta.weightage,
      marksRange: meta.marksRange,
      isHighPriority: meta.isHighPriority,
      priorityRank: meta.priorityRank,
      frequentlyAsked: meta.frequentlyAsked,
      importantFormulas: meta.importantFormulas,
      order: meta.order,
      description: meta.description,
      syllabus: meta.units,
    }));

    const subjects = await Subject.insertMany(subjectsToInsert);
    console.log(`✅ Inserted ${subjects.length} subjects`);

    const subjectMap = {};
    subjects.forEach((s) => { subjectMap[s.code] = s._id; });

    const topicsToInsert = [];
    Object.entries(GATE_SYLLABUS).forEach(([code, meta]) => {
      if (!subjectMap[code]) return;
      meta.topics.forEach((topicName, i) => {
        const doc = buildTopicDocument(code, meta, topicName, i + 1);
        topicsToInsert.push({ ...doc, subject: subjectMap[code] });
      });
    });

    await Topic.insertMany(topicsToInsert);
    console.log(`✅ Inserted ${topicsToInsert.length} topics with learning content`);

    const pyqResult = await importRows(SAMPLE_PYQS);
    console.log(`✅ Imported ${pyqResult.inserted.length} sample PYQs (${pyqResult.failed.length} failed)`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('📌 Run the app: cd .. && npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
