const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { audit } = require('../utils/audit');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
// Anyone except admin can self-register.
// Buyers are auto-approved. All other roles start as pending_approval
// and must be activated by an admin before they can log in.
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone, region, woreda } = req.body;

    // Admin accounts cannot be self-registered (FR-AUTH-08)
    if (role === 'admin') {
      return res.status(403).json({
        error: 'Admin accounts cannot be self-registered. Contact an existing administrator.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      // FR-AUTH-02: do not reveal whether the account exists
      return res.status(409).json({ error: 'Registration failed. Check your details and try again.' });
    }

    // Buyers are auto-approved; all other roles require admin activation
    const status = role === 'buyer' ? 'active' : 'pending_approval';

    const user = await User.create({
      firstName, lastName, email, password, role, phone, region, woreda, status,
    });

    await audit('user.register', {
      actor: user._id,
      actorRole: user.role,
      resourceType: 'User',
      resourceId: user._id,
      details: { email: user.email, role: user.role, status },
      req,
    });

    const token = signToken(user._id);
    res.status(201).json({
      message: status === 'active'
        ? 'Registration successful.'
        : 'Registration submitted. Your account is pending admin approval.',
      token: status === 'active' ? token : undefined,
      user: { id: user._id, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Select password explicitly (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');

    // FR-AUTH-02: do not reveal whether the specific account exists
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account is not active. Contact an administrator.',
        accountStatus: user.status,
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await audit('user.login', {
      actor: user._id,
      actorRole: user.role,
      resourceType: 'User',
      resourceId: user._id,
      req,
    });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout  (client-side token removal; server records the event)
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await audit('user.logout', {
        actor: req.user._id,
        actorRole: req.user.role,
        resourceType: 'User',
        resourceId: req.user._id,
        req,
      });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, logout, getMe };
