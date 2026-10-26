const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ProduceBatch = require('../models/ProduceBatch');
const { toKg } = require('../utils/units');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'supplier') filter.supplier = req.user._id;
    if (req.query.order) filter.order = req.query.order;
    const batches = await ProduceBatch.find(filter)
      .populate('commodity', 'name')
      .populate('supplier', 'firstName lastName')
      .populate('order', 'orderNumber status')
      .populate('delivery', 'status');
    res.json({ batches });
  } catch (err) { next(err); }
});

router.get('/:id/trace', async (req, res, next) => {
  try {
    const batch = await ProduceBatch.findById(req.params.id)
      .populate('commodity', 'name')
      .populate('supplier', 'firstName lastName')
      .populate('inventory')
      .populate({ path: 'order', populate: [{ path: 'buyer', select: 'firstName lastName' }] })
      .populate('delivery');
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    // FR-INV-09: indicate missing links rather than inferring
    const trace = {
      batch: { id: batch._id, batchNumber: batch.batchNumber, quantityKg: batch.quantityKg },
      inventory: batch.inventory || { missing: true, note: 'No inventory record linked.' },
      order: batch.order || { missing: true, note: 'No order linked to this batch.' },
      delivery: batch.delivery || { missing: true, note: 'No delivery linked to this batch.' },
    };
    res.json({ trace });
  } catch (err) { next(err); }
});

router.post('/', authorize('supplier', 'agent', 'admin'), async (req, res, next) => {
  try {
    const { commodity, inventory, order, delivery, submittedQuantity, submittedUnit, harvestDate, qualityGrade, notes, sourceType } = req.body;
    const quantityKg = toKg(parseFloat(submittedQuantity), submittedUnit || 'kg');
    const batch = await ProduceBatch.create({
      supplier: req.body.supplierId || req.user._id,
      commodity, inventory, order, delivery, quantityKg, harvestDate, qualityGrade, notes,
      sourceType: sourceType || 'unverified',
      createdBy: req.user._id,
    });
    res.status(201).json({ batch });
  } catch (err) { next(err); }
});

module.exports = router;
