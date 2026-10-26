const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT and attaches req.user.
 * Returns 401 if the token is missing or invalid.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account is not active. Contact an administrator.',
        accountStatus: user.status,
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Restricts access to the listed roles.
 * Usage: authorize('admin', 'data_reviewer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

/**
 * Checks that a Data Reviewer has scope to review the given market and/or commodity.
 * Call after authenticate. Attach marketId / commodityId to req before calling.
 * Admins always pass.
 */
const checkReviewScope = (getMarketId, getCommodityId) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    if (user.role === 'admin') return next(); // Admins bypass scope check

    if (user.role !== 'data_reviewer') {
      return res.status(403).json({ error: 'Data reviewer role required.' });
    }

    const scope = user.reviewScope || {};
    if (scope.systemWide) return next();

    const marketId = getMarketId ? getMarketId(req) : null;
    const commodityId = getCommodityId ? getCommodityId(req) : null;

    const marketAllowed =
      !marketId ||
      (scope.markets && scope.markets.map(String).includes(String(marketId)));

    const commodityAllowed =
      !commodityId ||
      (scope.commodities && scope.commodities.map(String).includes(String(commodityId)));

    if (!marketAllowed || !commodityAllowed) {
      return res.status(403).json({
        error: 'You do not have review scope for this market or commodity.',
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize, checkReviewScope };
