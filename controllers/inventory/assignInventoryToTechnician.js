const Item = require('../../models/inventoryModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const User = require('../../models/userModel');

const assignInventoryToTechnician = async (req, res) => {
  try {
    // Only managers can assign inventory
    if (req.userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only managers can assign inventory.'
      });
    }
    
    const { technicianId, type, itemId, serialNumber, quantity } = req.body;
    
    // Check if technician exists and belongs to manager's branch
    const technician = await User.findOne({ 
      _id: technicianId, 
      role: 'technician',
      branch: req.userBranch
    });
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found or not in your branch'
      });
    }
    
    // Find the inventory item
    const item = await Item.findOne({ id: itemId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // For serialized products, check if serial number exists and belongs to manager's branch
    if (type === 'serialized-product') {
      const stockItem = item.stock.find(
        s => s.serialNumber === serialNumber && s.branch.toString() === req.userBranch.toString()
      );
      
      if (!stockItem) {
        return res.status(400).json({
          success: false,
          message: 'Serial number not found in your branch inventory'
        });
      }
      
      // Remove serial number from main inventory
      // Remove serial number from main inventory (only from manager's branch)
  item.stock = item.stock.filter(s => !(s.serialNumber === serialNumber && s.branch.toString() === req.user.branch.toString()));
  await item.save();
      
      // Add to technician's inventory
      let techInventory = await TechnicianInventory.findOne({
        technician: technicianId,
        item: item._id
      });
      
      if (!techInventory) {
        techInventory = new TechnicianInventory({
          technician: technicianId,
          item: item._id,
          branch: req.userBranch,
          serializedItems: [],
          genericQuantity: 0
        });
      }
      
      techInventory.serializedItems.push({
        serialNumber,
        assignedAt: new Date(),
        assignedBy: req.userId
      });
      
      await techInventory.save();
    } else if (type === 'generic-product') {
      // For generic products, check if sufficient quantity exists
      const totalStock = item.stock.reduce((total, stockItem) => {
        if (stockItem.branch.toString() === req.userBranch.toString()) {
          return total + stockItem.quantity;
        }
        return total;
      }, 0);
      
      if (totalStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${totalStock} ${item.unit}(s) available.`
        });
      }
      
      // Reduce inventory from stock entries
      let remainingToReduce = quantity;
      
      for (let i = 0; i < item.stock.length && remainingToReduce > 0; i++) {
        if (item.stock[i].branch.toString() === req.userBranch.toString()) {
          const currentQty = item.stock[i].quantity;
          
          if (currentQty <= remainingToReduce) {
            // Remove entire stock entry
            remainingToReduce -= currentQty;
            item.stock[i].quantity = 0;
          } else {
            // Reduce from this entry
            item.stock[i].quantity -= remainingToReduce;
            remainingToReduce = 0;
          }
        }
      }
      
      // Remove any empty stock entries
      item.stock = item.stock.filter(s => s.quantity > 0);
      await item.save();
      
      // Add to technician's inventory
      let techInventory = await TechnicianInventory.findOne({
        technician: technicianId,
        item: item._id
      });
      
      if (!techInventory) {
        techInventory = new TechnicianInventory({
          technician: technicianId,
          item: item._id,
          branch: req.userBranch,
          serializedItems: [],
          genericQuantity: 0
        });
      }
      
      techInventory.genericQuantity += quantity;
      techInventory.lastUpdated = new Date();
      techInventory.lastUpdatedBy = req.userId;
      
      await techInventory.save();
    }
    
    res.json({
      success: true,
      message: 'Inventory assigned successfully',
      data: {
        technicianId,
        itemId,
        type,
        quantity: type === 'serialized-product' ? 1 : quantity
      }
    });
  } catch (err) {
    console.error('Error assigning inventory:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = assignInventoryToTechnician;