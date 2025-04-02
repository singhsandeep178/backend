const Item = require('../../models/inventoryModel');

const checkSerialNumber = async (req, res) => {
    try {
      const { serialNumber } = req.params;
      
      // ఄCheck if serial number already exists in ANY item
      const existingSerialNumber = await Item.findOne({
        'stock.serialNumber': serialNumber
      });
      
      if (existingSerialNumber) {
        return res.json({
          exists: true,
          item: {
            id: existingSerialNumber.id,
            name: existingSerialNumber.name
          }
        });
      }
      
      res.json({
        exists: false
      });
    } catch (err) {
      console.error('Error checking serial number:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

module.exports = checkSerialNumber;  