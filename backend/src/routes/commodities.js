const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Commodity = require('../models/Commodity');
const { audit } = require('../utils/audit');

// GET /api/commodities — public-ish, requires auth
router.get('/', authenticate, async (req, res, next) => {
  try {
    const commodities = await Commodity.find({ isActive: true }).sort({ name: 1 });
    res.json({ commodities });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const commodity = await Commodity.findById(req.params.id);
    if (!commodity) return res.status(404).json({ error: 'Commodity not found.' });
    res.json({ commodity });
  } catch (err) { next(err); }
});

router.post(
  '/',
  authenticate, authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name required.'),
    body('defaultDisplayUnit').optional().isIn(['kg', 'quintal', 'tonne']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const commodity = await Commodity.create({ ...req.body, createdBy: req.user._id });
      await audit('commodity.create', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Commodity', resourceId: commodity._id, req });
      res.status(201).json({ commodity });
    } catch (err) { next(err); }
  }
);

router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const commodity = await Commodity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!commodity) return res.status(404).json({ error: 'Commodity not found.' });
    await audit('commodity.update', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Commodity', resourceId: commodity._id, req });
    res.json({ commodity });
  } catch (err) { next(err); }
});

// Deactivate — does not delete historical records (FR-COM-05)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const commodity = await Commodity.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!commodity) return res.status(404).json({ error: 'Commodity not found.' });
    await audit('commodity.deactivate', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Commodity', resourceId: commodity._id, req });
    res.json({ message: 'Commodity deactivated. Historical records retained.', commodity });
  } catch (err) { next(err); }
});

module.exports = router;
