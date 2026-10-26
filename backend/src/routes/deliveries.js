const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Delivery = require('../models/Delivery');
const Notification = require('../models/Notification');
const { audit } = require('../utils/audit');

const DELIVERY_TRANSITIONS = {
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: [],
  cancelled: [],
};

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'transporter') filter.transporter = req.user._id;
    const deliveries = await Delivery.find(filter)
      .populate('order', 'orderNumber status')
      .populate('transporter', 'firstName lastName');
    res.json({ deliveries });
  } catch (err) { next(err); }
});

router.post('/', authorize('admin', 'supplier'), async (req, res, next) => {
  try {
    const delivery = await Delivery.create({ ...req.body, assignedBy: req.user._id, assignedAt: new Date() });
    await audit('delivery.create', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Delivery', resourceId: delivery._id, req });
    res.status(201).json({ delivery });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authorize('transporter', 'admin'), [
  body('status').isIn(Delivery.DELIVERY_STATES).withMessage('Invalid delivery status.'),
], validate, async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });

    // Transporter can only update their own deliveries
    if (req.user.role === 'transporter' && String(delivery.transporter) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const allowed = DELIVERY_TRANSITIONS[delivery.status];
    if (!allowed.includes(req.body.status)) {
      return res.status(422).json({
        error: `Cannot transition delivery from "${delivery.status}" to "${req.body.status}".`,
        allowedTransitions: allowed,
      });
    }

    delivery.stateHistory.push({ fromState: delivery.status, toState: req.body.status, updatedBy: req.user._id, notes: req.body.notes });
    delivery.status = req.body.status;
    if (req.body.status === 'delivered') delivery.actualDeliveryDate = new Date();
    await delivery.save();

    await audit('delivery.statusChange', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Delivery', resourceId: delivery._id, details: { to: req.body.status }, req });
    res.json({ delivery });
  } catch (err) { next(err); }
});

module.exports = router;
