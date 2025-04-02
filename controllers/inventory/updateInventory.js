const Item = require('../../models/inventoryModel');

const updateInventory = async (req, res) => {
    try {
      const { type, name, unit, warranty, mrp, purchasePrice, salePrice } = req.body;
      
      // Find the item
      const item = await Item.findOne({ id: req.params.id });
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      // Update fields
      item.type = type || item.type;
      item.name = name || item.name;
      
      if (type === 'product' || item.type === 'product') {
        item.unit = unit || item.unit;
        item.warranty = warranty || item.warranty;
        item.mrp = mrp || item.mrp;
        item.purchasePrice = purchasePrice || item.purchasePrice;
      }
      
      item.salePrice = salePrice || item.salePrice;
      item.updatedAt = new Date();
      
      await item.save();
      
      res.json({
        success: true,
        item
      });
    } catch (err) {
      console.error('Error updating inventory item:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

module.exports = updateInventory;  