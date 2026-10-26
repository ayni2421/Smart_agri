const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize, checkReviewScope } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { submitPrice, getPrices, comparePrices, reviewPrice } = require('../controllers/priceController');

router.use(authenticate);

router.post(
  '/',
  authorize('agent', 'farmer', 'admin'),
  [
    body('commodity').isMongoId().withMessage('Valid commodity ID required.'),
    body('market').isMongoId().withMessage('Valid market ID required.'),
    body('submittedPrice').isFloat({ gt: 0 }).withMessage('Price must be a positive number.'),
    body('submittedUnit').isIn(['kg', 'quintal', 'tonne']).withMessage('Unsupported unit.'),
    body('observationDate').isISO8601().withMessage('Valid ISO 8601 date required.'),
    body('sourceType').isIn(['verified', 'submitted', 'synthetic', 'imported', 'unverified'])
      .withMessage('Invalid source type.'),
  ],
  validate,
  submitPrice
);

router.get('/', getPrices);
router.get('/compare', comparePrices);

router.patch(
  '/:id/review',
  authorize('data_reviewer', 'admin'),
  checkReviewScope(
    (req) => req.body.marketId,
    (req) => req.body.commodityId
  ),
  [
    body('decision').isIn(['approved', 'rejected', 'correction_requested'])
      .withMessage('Invalid review decision.'),
  ],
  validate,
  reviewPrice
);

module.exports = router;
