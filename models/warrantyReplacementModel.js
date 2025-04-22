const mongoose = require('mongoose');

const warrantyReplacementSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  originalWorkOrderId: {
    type: String,
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'replaced'],
    default: 'pending'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  replacementSerialNumber: {
    type: String
  },
  replacementWorkOrderId: {
    type: String
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

const WarrantyReplacement = mongoose.model('WarrantyReplacement', warrantyReplacementSchema);
module.exports = WarrantyReplacement;