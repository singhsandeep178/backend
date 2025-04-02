const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['product', 'service']
  },
  name: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: function() {
      return this.type === 'product';
    }
  },
  warranty: {
    type: String,
    required: function() {
      return this.type === 'product';
    }
  },
  mrp: {
    type: Number,
    required: function() {
      return this.type === 'product';
    }
  },
  purchasePrice: {
    type: Number,
    required: function() {
      return this.type === 'product';
    }
  },
  salePrice: {
    type: Number,
    required: true
  },
  stock: [stockSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const inventoryModel = mongoose.model('Item', itemSchema);

module.exports = inventoryModel;