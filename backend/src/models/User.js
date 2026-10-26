const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['farmer', 'agent', 'buyer', 'supplier', 'transporter', 'data_reviewer', 'admin'];
const ACCOUNT_STATUSES = ['pending_approval', 'active', 'suspended', 'deactivated'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName:  { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone:    { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role:     { type: String, enum: ROLES, required: true },
    status:   { type: String, enum: ACCOUNT_STATUSES, default: 'pending_approval' },

    // Agent-specific: farmers this agent manages
    managedFarmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Supplier/Farmer profile link
    supplierProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProfile' },

    // Data Reviewer scope (FR-AUTH-11)
    // Stored as a plain Mixed object — avoids subdocument casting issues in Mongoose 9
    reviewScope: {
      type: mongoose.Schema.Types.Mixed,
      default: { systemWide: false, markets: [], commodities: [] },
    },

    region:    { type: String, trim: true },
    woreda:    { type: String, trim: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save — async style for Mongoose 9
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.ROLES = ROLES;
userSchema.statics.ACCOUNT_STATUSES = ACCOUNT_STATUSES;

module.exports = mongoose.model('User', userSchema);
