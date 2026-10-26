const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { enforceOrderTransition } = require('../middleware/orderTransition');
const validate = require('../middleware/validate');
const { createOrder, getOrders, getOrder, transitionOrder } = require('../controllers/orderController');
const Order = require('../models/Order');

// Middleware to load order and attach to req
const loadOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    req.order = order;
    next();
  } catch (err) {
    next(err);
  }
};

router.use(authenticate);

router.post(
  '/',
  authorize('buyer'),
  [
    body('commodity').isMongoId().withMessage('Valid commodity ID required.'),
    body('submittedQuantity').isFloat({ gt: 0 }).withMessage('Quantity must be a positive number.'),
    body('submittedUnit').isIn(['kg', 'quintal', 'tonne']).withMessage('Unit must be kg, quintal, or tonne.'),
    body('deliveryLocation').optional().trim(),
  ],
  validate,
  createOrder
);

router.get('/', getOrders);
router.get('/:id', getOrder);

router.patch(
  '/:id/status',
  loadOrder,
  [
    body('status').isIn(Order.ORDER_STATES).withMessage('Invalid status value.'),
  ],
  validate,
  enforceOrderTransition,
  transitionOrder
);

module.exports = router;
