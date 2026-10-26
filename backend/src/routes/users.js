const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const User = require('../models/User');
const { audit } = require('../utils/audit');

router.use(authenticate);

// GET /api/users  — Admin only
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    // Only admin or the user themselves can view full profile
    if (req.user.role !== 'admin' && String(req.user._id) !== String(user._id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json({ user });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/status — Admin approves/suspends account (FR-AUTH-10)
router.patch(
  '/:id/status',
  authorize('admin'),
  [body('status').isIn(User.ACCOUNT_STATUSES).withMessage('Invalid account status.')],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const previous = user.status;
      user.status = req.body.status;
      await user.save();
      await audit('user.statusChange', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { from: previous, to: req.body.status },
        req,
      });
      res.json({ message: `Account status updated to "${req.body.status}".`, user });
    } catch (err) { next(err); }
  }
);

// PATCH /api/users/:id/review-scope — Assign Data Reviewer scope (FR-AUTH-11)
router.patch(
  '/:id/review-scope',
  authorize('admin'),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (user.role !== 'data_reviewer') {
        return res.status(400).json({ error: 'Review scope can only be set for data_reviewer accounts.' });
      }
      user.reviewScope = req.body.reviewScope;
      await user.save();
      await audit('user.reviewScopeChanged', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { newScope: req.body.reviewScope },
        req,
      });
      res.json({ message: 'Review scope updated.', reviewScope: user.reviewScope });
    } catch (err) { next(err); }
  }
);

// PATCH /api/users/:id/role — Admin assigns a new role to a user
router.patch(
  '/:id/role',
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { role, reviewScope } = req.body;

      if (!User.ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Valid roles: ${User.ROLES.join(', ')}` });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      // Prevent removing the last admin
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin', status: 'active' });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot change the role of the last active admin.' });
        }
      }

      const previousRole = user.role;
      user.role = role;

      // Set reviewer scope if assigning data_reviewer
      if (role === 'data_reviewer' && reviewScope) {
        user.reviewScope = reviewScope;
      }

      await user.save();

      await audit('user.roleChange', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { from: previousRole, to: role },
        req,
      });

      res.json({
        message: `Role changed from "${previousRole}" to "${role}".`,
        user,
      });
    } catch (err) { next(err); }
  }
);

router.patch('/:id/profile', async (req, res, next) => {
  try {
    const requesterId = String(req.user._id);
    const targetId    = String(req.params.id);

    // Users can only update their own profile; admins can update anyone
    if (req.user.role !== 'admin' && requesterId !== targetId) {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }

    const allowed = ['firstName', 'lastName', 'phone', 'region', 'woreda'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(targetId, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await audit('user.profileUpdate', {
      actor: req.user._id, actorRole: req.user.role,
      resourceType: 'User', resourceId: user._id,
      details: { fields: Object.keys(updates) }, req,
    });

    res.json({ user });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/password — change own password
router.patch('/:id/password', async (req, res, next) => {
  try {
    const requesterId = String(req.user._id);
    const targetId    = String(req.params.id);

    if (requesterId !== targetId) {
      return res.status(403).json({ error: 'You can only change your own password.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(targetId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    await audit('user.passwordChange', {
      actor: req.user._id, actorRole: req.user.role,
      resourceType: 'User', resourceId: user._id, req,
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

// Admin creates staff accounts (agents, reviewers, transporters, suppliers)
router.post(
  '/',
  authorize('admin'),
  [
    body('firstName').trim().notEmpty().withMessage('First name required.'),
    body('lastName').trim().notEmpty().withMessage('Last name required.'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(User.ROLES).withMessage('Invalid role.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, password, role, phone, region, woreda } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already in use.' });
      const user = await User.create({
        firstName, lastName, email, password, role, phone, region, woreda,
        status: 'active', // Admin-created accounts are immediately active
      });
      await audit('user.adminCreate', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { email: user.email, role: user.role },
        req,
      });
      res.status(201).json({ user });
    } catch (err) { next(err); }
  }
);

module.exports = router;
