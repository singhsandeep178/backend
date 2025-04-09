// controllers/technician/returnInventoryToManager.js
const mongoose = require('mongoose');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const Item = require('../../models/inventoryModel');
const TransferHistory = require('../../models/transferHistoryModel');

const returnInventoryToManager = async (req, res) => {
  try {
    // Only technicians can return inventory
    if (req.userRole !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only technicians can return inventory.'
      });
    }
    
    const { type, itemId, serialNumber, quantity } = req.body;
    
    console.log("Return request received:", { type, itemId, serialNumber, quantity });
    
    // First, find the item by its custom string ID
    const item = await Item.findOne({ id: itemId });
    
    if (!item) {
      console.log("Item not found with ID:", itemId);
      return res.status(404).json({
        success: false,
        message: 'Item not found in inventory'
      });
    }
    
    console.log("Found item:", item.name, "with MongoDB _id:", item._id);
    
    // Then find the technician's inventory using the MongoDB _id
    const techInventory = await TechnicianInventory.findOne({
      technician: req.userId,
      item: item._id  // Use the MongoDB _id, not the custom string id
    });
    
    if (!techInventory) {
      console.log("Technician inventory not found for item:", item._id);
      return res.status(404).json({
        success: false,
        message: 'Item not found in your inventory'
      });
    }
    
    console.log("Found technician inventory:", techInventory._id);
    
    // Handle the return based on item type
    if (type === 'serialized-product') {
      // Find the serial number in technician's inventory
      const serialItemIndex = techInventory.serializedItems.findIndex(
        item => item.serialNumber === serialNumber && item.status === 'active'
      );
      
      if (serialItemIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'Serial number not found in your inventory or already used'
        });
      }
      
      console.log("Found serialized item at index:", serialItemIndex);
      
      // Remove from technician inventory
      const serialItem = techInventory.serializedItems.splice(serialItemIndex, 1)[0];
      
      // Add back to main inventory
      item.stock.push({
        serialNumber,
        quantity: 1,
        date: new Date(),
        branch: req.userBranch
      });
      
      // Create transfer record for history
      await new TransferHistory({
        fromType: 'technician',
        fromId: req.userId,
        toType: 'branch',
        toId: req.userBranch,
        item: item._id,
        serialNumber,
        quantity: 1,
        transferredBy: req.userId
      }).save();
      
      console.log("Created transfer history record for serialized item");
    } else {
      // For generic products
      if (!quantity || quantity <= 0 || quantity > techInventory.genericQuantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity. You have ${techInventory.genericQuantity} ${item.unit}(s).`
        });
      }
      
      console.log("Valid quantity for generic item:", quantity);
      
      // Reduce from technician's inventory
      techInventory.genericQuantity -= quantity;
      
      // Add back to main inventory
      item.stock.push({
        quantity,
        date: new Date(),
        branch: req.userBranch
      });
      
      // Create transfer record
      await new TransferHistory({
        fromType: 'technician',
        fromId: req.userId,
        toType: 'branch',
        toId: req.userBranch,
        item: item._id,
        quantity,
        transferredBy: req.userId
      }).save();
      
      console.log("Created transfer history record for generic item");
    }
    
    // Update last modified info
    techInventory.lastUpdated = new Date();
    techInventory.lastUpdatedBy = req.userId;
    
    // Save changes
    console.log("Saving item and technician inventory changes");
    await item.save();
    await techInventory.save();
    
    console.log("Return successful");
    res.json({
      success: true,
      message: 'Inventory returned successfully',
      data: {
        itemId,
        type,
        quantity: type === 'serialized-product' ? 1 : quantity
      }
    });
  } catch (err) {
    console.error('Error returning inventory:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = returnInventoryToManager;