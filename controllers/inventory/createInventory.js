const Item = require('../../models/inventoryModel');

const createInventory = async (req, res) => {
    try {
      const { id, type, name, unit, warranty, mrp, purchasePrice, salePrice } = req.body;
      
      // Check if item with same ID already exists
      const existingItemWithId = await Item.findOne({ id });
      if (existingItemWithId) {
        return res.status(400).json({
          success: false,
          message: 'Item with this ID already exists'
        });
      }
      
      // Check if item with same name already exists
      const existingItemWithName = await Item.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } // Case insensitive name search
      });
      if (existingItemWithName) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }
      
      const newItem = new Item({
        id,
        type,
        name,
        unit,
        warranty,
        mrp,
        purchasePrice,
        salePrice,
        stock: []
      });
      
      await newItem.save();
      
      res.json({
        success: true,
        item: newItem
      });
    } catch (err) {
      console.error('Error adding inventory item:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

module.exports = createInventory;  