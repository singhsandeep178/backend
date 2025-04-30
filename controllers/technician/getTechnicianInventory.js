const TechnicianInventory = require('../../models/technicianInventoryModel');
const Item = require('../../models/inventoryModel');
const getTechnicianInventory = async (req, res) => {
  try {
    // Only technicians can access their inventory
    if (req.userRole !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can view their inventory.'
      });
    }
   
    // Find all inventory assigned to this technician
    const technicianInventory = await TechnicianInventory.find({
      technician: req.userId
    }).populate('item');
   
    // Format the response
    const formattedInventory = technicianInventory.map(inventory => {
      const item = inventory.item;
     
      return {
        id: inventory._id,
        itemId: item.id,
        itemName: item.name,
        type: item.type,
        unit: item.unit,
        salePrice: item.salePrice,
        serializedItems: inventory.serializedItems,
        genericQuantity: inventory.genericQuantity,
        lastUpdated: inventory.updatedAt || inventory.createdAt
      };
    });
   
    res.status(200).json({
      success: true,
      count: formattedInventory.length,
      data: formattedInventory
    });
  } catch (err) {
    console.error('Error fetching technician inventory:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory'
    });
  }
};
module.exports = getTechnicianInventory;