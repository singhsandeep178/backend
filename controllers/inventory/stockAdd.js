const Item = require('../../models/inventoryModel');

const stockAdd = async (req, res) => {
    try {
      const { itemId, serialNumber, quantity, date } = req.body;
      
      // Find the item
      const item = await Item.findOne({ id: itemId });
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      // Check if serial number already exists in ANY item
      const existingSerialNumber = await Item.findOne({
        'stock.serialNumber': serialNumber
      });
      
      if (existingSerialNumber) {
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists in inventory',
          existingItem: {
            id: existingSerialNumber.id,
            name: existingSerialNumber.name
          }
        });
      }
      
      // Add stock
      item.stock.push({
        serialNumber,
        quantity,
        date: date || new Date()
      });
      
      item.updatedAt = new Date();
      await item.save();
      
      res.json({
        success: true,
        item
      });
    } catch (err) {
      console.error('Error adding stock:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };  

module.exports = stockAdd;  