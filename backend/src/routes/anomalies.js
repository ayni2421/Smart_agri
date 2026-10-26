const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const PriceObservation = require('../models/PriceObservation');

router.use(authenticate);

// GET /api/anomalies — flagged observations for reviewer
router.get('/', authorize('data_reviewer', 'admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { isFlagged: true };

    // Scope enforcement for data_reviewer (FR-AUTH-11)
    if (req.user.role === 'data_reviewer' && !req.user.reviewScope?.systemWide) {
      if (req.user.reviewScope?.markets?.length) filter.market = { $in: req.user.reviewScope.markets };
      if (req.user.reviewScope?.commodities?.length) filter.commodity = { $in: req.user.reviewScope.commodities };
    }

    const [observations, total] = await Promise.all([
      PriceObservation.find(filter)
        .populate('commodity', 'name')
        .populate('market', 'name region')
        .populate('submittedBy', 'firstName lastName role')
        .sort({ flaggedAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      PriceObservation.countDocuments(filter),
    ]);
    res.json({ observations, total });
  } catch (err) { next(err); }
});

module.exports = router;
