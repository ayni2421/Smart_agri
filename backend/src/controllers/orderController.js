const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const { toKg } = require('../utils/units');
const { audit } = require('../utils/audit');
const { recordTransition } = require('../middleware/orderTransition');

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const {
      commodity, market, submittedQuantity, submittedUnit,
      deliveryLocation, deliveryDeadline, notes,
    } = req.body;

    const quantityKg = toKg(parseFloat(submittedQuantity), submittedUnit);

    const order = await Order.create({
      buyer: req.user._id,
      commodity,
      market,
      quantityKg,
      submittedQuantity,
      submittedUnit,
      deliveryLocation,
      deliveryDeadline,
      notes,
      status: 'draft',
      stateHistory: [],
    });

    await audit('order.create', {
      actor: req.user._id,
      actorRole: req.user.role,
      resourceType: 'Order',
      resourceId: order._id,
      details: { orderNumber: order.orderNumber },
      req,
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders
const getOrders = async (req, res, next) => {
  try {
    const { status, commodity, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Role-based filtering (FR-ORD-08)
    if (req.user.role === 'buyer') filter.buyer = req.user._id;
    else if (req.user.role === 'supplier') filter.supplier = req.user._id;
    else if (req.user.role === 'transporter') {
      // Transporters see orders with deliveries assigned to them
      // Handled via delivery query — simplified here
      filter.status = { $in: ['in_fulfillment', 'delivered'] };
    }

    if (status) filter.status = status;
    if (commodity) filter.commodity = commodity;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('buyer', 'firstName lastName email')
        .populate('supplier', 'firstName lastName email')
        .populate('commodity', 'name defaultDisplayUnit')
        .populate('market', 'name region')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'firstName lastName email phone')
      .populate('supplier', 'firstName lastName email phone')
      .populate('commodity', 'name nameAmharic defaultDisplayUnit')
      .populate('market', 'name region zone')
      .populate('delivery')
      .populate('transaction', 'transactionNumber status amountETB');

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Access control
    const uid = String(req.user._id);
    if (
      req.user.role !== 'admin' &&
      String(order.buyer._id) !== uid &&
      String(order.supplier?._id) !== uid
    ) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status — enforced by enforceOrderTransition middleware
const transitionOrder = async (req, res, next) => {
  try {
    const order = req.order; // attached by middleware
    const transition = req.transition; // validated by enforceOrderTransition

    const previousStatus = order.status;
    order.status = transition.to;

    // Update supplier if being accepted
    if (transition.to === 'accepted' && req.body.supplierId) {
      order.supplier = req.body.supplierId;
    }

    // Record transition history (FR-ORD-11)
    await recordTransition(order, transition, req);
    await order.save();

    // Notify relevant parties
    const notifyUserId =
      req.user.role === 'buyer' ? order.supplier : order.buyer;
    if (notifyUserId) {
      await Notification.create({
        recipient: notifyUserId,
        type: 'order_status_change',
        title: `Order ${order.orderNumber} updated`,
        message: `Status changed from "${previousStatus}" to "${transition.to}".`,
        relatedEntity: { type: 'Order', id: order._id },
      });
    }

    res.json({
      message: `Order transitioned from "${previousStatus}" to "${transition.to}".`,
      order: { id: order._id, orderNumber: order.orderNumber, status: order.status },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getOrders, getOrder, transitionOrder };
