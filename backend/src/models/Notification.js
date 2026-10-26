const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'order_status_change',
        'delivery_update',
        'price_flagged',
        'review_decision',
        'account_approved',
        'system',
      ],
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    relatedEntity: {
      type: { type: String, enum: ['Order', 'Delivery', 'PriceObservation', 'User', null] },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    // FR-NOT-04: do not claim external delivery unless confirmed
    externalDeliveryStatus: {
      type: String,
      enum: ['not_attempted', 'sent', 'failed', null],
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
