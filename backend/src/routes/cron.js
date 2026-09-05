const express = require('express');
const router = express.Router();
router.use((req, res) => res.status(404).json({ success: false, message: 'Route not implemented' }));
module.exports = router;