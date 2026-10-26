const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const { audit } = require('../utils/audit');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'buyer') filter.buyer = req.user._id;
    else if (req.user.role === 'supplier') filter.supplier = req.user._id;
    const transactions = await Transaction.find(filter)
      .populate('order', 'orderNumber status')
      .populate('buyer', 'firstName lastName')
      .populate('supplier', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (err) { next(err); }
});

router.post('/', authorize('admin', 'buyer'), async (req, res, next) => {
  try {
    const tx = await Transaction.create({ ...req.body, recordedBy: req.user._id, recordedAt: new Date() });
    await audit('transaction.create', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Transaction', resourceId: tx._id, req });
    res.status(201).json({ transaction: tx });
  } catch (err) { next(err); }
});

// FR-PAY-09 fallback: update status manually
router.patch('/:id/status', authorize('admin', 'buyer', 'supplier'), async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
    const { status, notes } = req.body;
    if (!Transaction.TRANSACTION_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid transaction status.' });
    }
    // FR-PAY-07: do not mark confirmed just because a request was submitted
    tx.statusHistory.push({ fromStatus: tx.status, toStatus: status, updatedBy: req.user._id, notes });
    tx.status = status;
    await tx.save();
    await audit('transaction.statusChange', { actor: req.user._id, actorRole: req.user.role, resourceType: 'Transaction', resourceId: tx._id, details: { to: status }, req });
    res.json({ transaction: tx });
  } catch (err) { next(err); }
});

module.exports = router;
