const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const PriceObservation = require('../models/PriceObservation');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');

router.use(authenticate);

// GET /api/reports/market-summary
router.get('/market-summary', async (req, res, next) => {
  try {
    const { commodity, startDate, endDate } = req.query;
    const filter = {};
    if (commodity) filter.commodity = commodity;
    if (startDate || endDate) {
      filter.observationDate = {};
      if (startDate) filter.observationDate.$gte = new Date(startDate);
      if (endDate) filter.observationDate.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: filter },
      { $group: {
        _id: { commodity: '$commodity', market: '$market', sourceType: '$sourceType' },
        count: { $sum: 1 },
        avgPricePerKg: { $avg: '$pricePerKg' },
        minPricePerKg: { $min: '$pricePerKg' },
        maxPricePerKg: { $max: '$pricePerKg' },
        flaggedCount: { $sum: { $cond: ['$isFlagged', 1, 0] } },
      }},
    ];

    const results = await PriceObservation.aggregate(pipeline);
    res.json({
      summary: results,
      note: 'FR-REP-03: Synthetic and unverified data are labeled via sourceType field.',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// GET /api/reports/supply-demand
router.get('/supply-demand', async (req, res, next) => {
  try {
    const { commodity } = req.query;
    if (!commodity) return res.status(400).json({ error: 'commodity is required.' });
    const [supplyResult, demandResult] = await Promise.all([
      Inventory.aggregate([
        { $match: { commodity: new (require('mongoose').Types.ObjectId)(commodity), isActive: true } },
        { $group: { _id: '$commodity', totalAvailableKg: { $sum: '$availableQuantityKg' }, supplierCount: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { commodity: new (require('mongoose').Types.ObjectId)(commodity), status: { $in: ['pending', 'accepted', 'confirmed'] } } },
        { $group: { _id: '$commodity', totalRequestedKg: { $sum: '$quantityKg' }, orderCount: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      commodity,
      supply: supplyResult[0] || { totalAvailableKg: 0, supplierCount: 0 },
      demand: demandResult[0] || { totalRequestedKg: 0, orderCount: 0 },
      note: 'FR-SD-05: This reflects recorded system data only, not all market activity.',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

module.exports = router;
