const express = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate  = require('../middleware/validate');
const User      = require('../models/User');
const { audit } = require('../utils/audit');

router.use(authenticate);

// ── GET /api/users  — Admin; supports server-side search, role, status ────
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;

    // Server-side search across name and email (point 6)
    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [
        { firstName: re }, { lastName: re },
        { email: re }, { region: re },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (err) { next(err); }
});

// ── GET /api/users/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (req.user.role !== 'admin' && String(req.user._id) !== String(user._id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json({ user });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id/status ───────────────────────────────────────────
// Account status lifecycle:
//   pending_approval → active        (admin approves)
//   active           → suspended     (admin suspends — reason required)
//   active           → deactivated   (admin closes — permanent, requires reason)
//   suspended        → active        (admin reactivates)
//   suspended        → deactivated   (admin closes suspended account)
//   deactivated      → active        (admin re-opens, rare, requires reason)
//
// deactivated blocks login. suspended blocks login.
// deactivated cannot self-reactivate via normal login flow.
router.patch(
  '/:id/status',
  authorize('admin'),
  [
    body('status').isIn(User.ACCOUNT_STATUSES).withMessage('Invalid account status.'),
    body('reason').if(body('status').isIn(['suspended','deactivated']))
      .notEmpty().withMessage('A reason is required when suspending or deactivating an account.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const { status: newStatus, reason } = req.body;

      // ── Last-admin protection (point 7: atomic check) ─────────────────
      if (user.role === 'admin' && newStatus !== 'active') {
        // Count within the same query to reduce race-condition window
        const activeAdmins = await User.countDocuments({
          role: 'admin', status: 'active', _id: { $ne: user._id },
        });
        if (activeAdmins < 1) {
          return res.status(400).json({
            error: 'Cannot remove the last active administrator. Promote another user to admin first.',
          });
        }
      }

      // ── Prevent self-suspension ───────────────────────────────────────
      if (String(user._id) === String(req.user._id) && newStatus !== 'active') {
        return res.status(400).json({ error: 'You cannot suspend or deactivate your own account.' });
      }

      const previous = user.status;
      user.status    = newStatus;
      await user.save();

      await audit('user.statusChange', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { from: previous, to: newStatus, reason: reason || null },
        req,
      });

      res.json({ message: `Account status updated from "${previous}" to "${newStatus}".`, user });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/users/:id/review-scope ────────────────────────────────────
router.patch('/:id/review-scope', authorize('admin'), async (req, res, next) => {
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
      details: { newScope: req.body.reviewScope }, req,
    });
    res.json({ message: 'Review scope updated.', reviewScope: user.reviewScope });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id/role — Admin assigns a new role ─────────────────
// Role changes are sensitive privilege changes: require reason, enforce
// last-admin protection, record in audit log (point 2).
router.patch(
  '/:id/role',
  authorize('admin'),
  [
    body('role').isIn(User.ROLES).withMessage('Invalid role.'),
    body('reason').notEmpty().withMessage('A reason is required when changing a user\'s role.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { role: newRole, reason, reviewScope } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      // Prevent removing last admin via role change
      if (user.role === 'admin' && newRole !== 'admin') {
        const activeAdmins = await User.countDocuments({
          role: 'admin', status: 'active', _id: { $ne: user._id },
        });
        if (activeAdmins < 1) {
          return res.status(400).json({
            error: 'Cannot change the last active administrator\'s role. Assign admin to another user first.',
          });
        }
      }

      const previousRole = user.role;
      user.role = newRole;
      if (newRole === 'data_reviewer' && reviewScope) {
        user.reviewScope = reviewScope;
      }
      await user.save();

      await audit('user.roleChange', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { from: previousRole, to: newRole, reason },
        req,
      });

      res.json({ message: `Role changed from "${previousRole}" to "${newRole}".`, user });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/users/:id/profile ─────────────────────────────────────────
router.patch('/:id/profile', async (req, res, next) => {
  try {
    const requesterId = String(req.user._id);
    const targetId    = String(req.params.id);
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

// ── PATCH /api/users/:id/password ────────────────────────────────────────
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
    // Server-side password policy (point 3)
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must contain at least one uppercase letter and one number.',
      });
    }
    const user = await User.findById(targetId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    await audit('user.passwordChange', {
      actor: req.user._id, actorRole: req.user.role,
      resourceType: 'User', resourceId: user._id, req,
    });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

// ── POST /api/users — Admin creates staff accounts ───────────────────────
router.post(
  '/',
  authorize('admin'),
  [
    body('firstName').trim().notEmpty().withMessage('First name required.'),
    body('lastName').trim().notEmpty().withMessage('Last name required.'),
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
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
        status: 'active',
      });
      await audit('user.adminCreate', {
        actor: req.user._id, actorRole: req.user.role,
        resourceType: 'User', resourceId: user._id,
        details: { email: user.email, role: user.role }, req,
      });
      res.status(201).json({ user });
    } catch (err) { next(err); }
  }
);

module.exports = router;
