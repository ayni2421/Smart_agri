const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Inventory = require('../models/Inventory');
const { toKg } = require('../utils/units');
const { audit } = require('../utils/audit');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'supplier') filter.supplier = req.user._id;
    if (req.query.commodity) filter.commodity = req.query.commodity;
    if (req.query.market) filter.market = req.query.market;
    const records = await Inventory.find(filter)
      .populate('commodity', 'name defaultDisplayUnit')
      .populate('market', 'name region')
      .populate('supplier', 'firstName lastName');
    res.json({ inventory: records });
  } catch (err) { next(err); }
});

router.post(
  '/',
  authorize('supplier', 'agent', 'admin'),
  [
    body('commodity').isMongoId(),
    body('submittedQuantity').isFloat({ gt: 0 }),
    body('submittedUnit').isIn(['kg', 'quintal', 'tonne']),
    body('submittedAskPrice').optional().isFloat({ gt: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { commodity, market, submittedQuantity, submittedUnit, submittedAskPrice, submittedAskUnit, harvestDate, storageLocation, notes } = req.body;
      const availableQuantityKg = toKg(parseFloat(submittedQuantity), submittedUnit);
      const askPricePerKg = submittedAskPrice
        ? toKg(parseFloat(submittedAskPrice), submittedAskUnit || submittedUnit)
        : undefined;

      const record = await Inventory.create({
        supplier: req.body.supplierId || req.user._id,
        commodity, market,
        availableQuantityKg, submittedQuantity, submittedUnit,
        askPricePerKg, submittedAskPrice, submittedAskUnit,
        harvestDate, storageLocation, notes,
      });
      await audit('inventory.create', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Inventory', resourceId: record._id, req });
      res.status(201).json({ record });
    } catch (err) { next(err); }
  }
);

router.patch('/:id', authorize('supplier', 'agent', 'admin'), async (req, res, next) => {
  try {
    const record = await Inventory.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Inventory record not found.' });
    if (req.user.role === 'supplier' && String(record.supplier) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const previousKg = record.availableQuantityKg;
    if (req.body.submittedQuantity && req.body.submittedUnit) {
      record.availableQuantityKg = toKg(parseFloat(req.body.submittedQuantity), req.body.submittedUnit);
      record.submittedQuantity = req.body.submittedQuantity;
      record.submittedUnit = req.body.submittedUnit;
      record.changeLog.push({ previousKg, newKg: record.availableQuantityKg, reason: req.body.reason, changedBy: req.user._id });
    }
    await record.save();
    res.json({ record });
  } catch (err) { next(err); }
});

module.exports = router;
