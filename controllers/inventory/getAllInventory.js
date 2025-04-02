const Item = require('../../models/inventoryModel');

const getAllInventory = async (req, res) => {
    try {
      const items = await Item.find();
      res.json({
        success: true,
        items
      });
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

 module.exports = getAllInventory; 