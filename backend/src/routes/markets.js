const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Market = require('../models/Market');
const { audit } = require('../utils/audit');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const markets = await Market.find({ isActive: true }).sort({ name: 1 });
    res.json({ markets });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ error: 'Market not found.' });
    res.json({ market });
  } catch (err) { next(err); }
});

router.post(
  '/',
  authenticate, authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('region').trim().notEmpty().withMessage('Region is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const market = await Market.create({ ...req.body, createdBy: req.user._id });
      await audit('market.create', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Market', resourceId: market._id, req });
      res.status(201).json({ market });
    } catch (err) { next(err); }
  }
);

router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const market = await Market.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!market) return res.status(404).json({ error: 'Market not found.' });
    await audit('market.update', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Market', resourceId: market._id, req });
    res.json({ market });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const market = await Market.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!market) return res.status(404).json({ error: 'Market not found.' });
    await audit('market.deactivate', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Market', resourceId: market._id, req });
    res.json({ message: 'Market deactivated. Historical records retained.', market });
  } catch (err) { next(err); }
});

module.exports = router;
