const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validateFields } = require('../middleware/validateInput');
const { isMongoConnected } = require('../config/db');
const { isMockAuthEnabled } = require('../config/devMode');
const { saveLocalCalendarEvent, getLocalCalendarEvents, updateLocalCalendarEvent, deleteLocalCalendarEvent } = require('../store/localDataStore');
const { CalendarEvent } = require('../models/CalendarEvent');

router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      const events = getLocalCalendarEvents(req.user._id);
      return res.json({ success: true, count: events.length, data: events });
    }
    const filter = { user: req.user._id };
    if (req.query.start) filter.start = { $gte: new Date(req.query.start) };
    if (req.query.end) filter.end = { ...filter.end, $lte: new Date(req.query.end) };
    if (req.query.type) filter.type = req.query.type;
    const events = await CalendarEvent.find(filter).sort('start');
    res.json({ success: true, count: events.length, data: events });
  } catch (e) { next(e); }
});

router.post('/', protect, validateFields([
  { name: 'title', type: 'string', required: true },
  { name: 'start', type: 'string', required: true },
]), async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      const event = saveLocalCalendarEvent({ ...req.body, user: req.user._id });
      return res.status(201).json({ success: true, data: event });
    }
    const event = await CalendarEvent.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (e) { next(e); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      const event = updateLocalCalendarEvent(req.params.id, req.user._id, req.body);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      return res.json({ success: true, data: event });
    }
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      const deleted = deleteLocalCalendarEvent(req.params.id, req.user._id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Event not found' });
      return res.json({ success: true, message: 'Event deleted' });
    }
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
