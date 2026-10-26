const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.use(authenticate);

// GET /api/audit — admin only (FR-REP-06, FR-REP-07)
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const { action, resourceType, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resourceType) filter.resourceType = resourceType;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'firstName lastName email role')
        .sort({ timestamp: -1 })
        .skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ logs, total });
  } catch (err) { next(err); }
});

// No POST, PATCH, or DELETE routes — FR-REP-06
module.exports = router;
