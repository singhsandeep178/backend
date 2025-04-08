const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const Item = require('../../models/inventoryModel');
const BillModel = require('../../models/billModel');

const createWorkOrderBill = async (req, res) => {
  try {
    // Only technicians can create bills
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can create bills.'
      });
    }
    
    const { customerId, orderId, items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for billing'
      });
    }
    
    // Find the customer and work order
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find the specific work order
    const workOrder = customer.workOrders.find(order => order.orderId === orderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    
    // Check if technician is assigned to this work order
    if (!workOrder.technician || workOrder.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this work order'
      });
    }
    
    // Get technician's inventory
    const technicianInventory = await TechnicianInventory.find({
      technician: req.user._id
    }).populate('item');
    
    // Check if all items are in technician's inventory
    const itemsToUpdate = [];
    const billItems = [];
    let totalAmount = 0;
    
    // Process each item in the bill
    for (const billItem of items) {
      // Find the item in technician's inventory
      const inventoryItem = technicianInventory.find(inv => 
        inv.item.id === billItem.itemId
      );
      
      if (!inventoryItem) {
        return res.status(400).json({
          success: false,
          message: `Item ${billItem.itemId} not found in your inventory`
        });
      }
      
      // Check if the item has enough quantity
      if (inventoryItem.item.type === 'serialized-product') {
        // For serialized items, check if serial number exists
        if (!billItem.serialNumber) {
          return res.status(400).json({
            success: false,
            message: `Serial number required for ${inventoryItem.item.name}`
          });
        }
        
        const serialItem = inventoryItem.serializedItems.find(
          serial => serial.serialNumber === billItem.serialNumber && serial.status === 'active'
        );
        
        if (!serialItem) {
          return res.status(400).json({
            success: false,
            message: `Serial number ${billItem.serialNumber} not found in your inventory or not active`
          });
        }
        
        // Add to items to update
        itemsToUpdate.push({
          inventoryId: inventoryItem._id,
          type: 'serialized',
          serialNumber: billItem.serialNumber
        });
        
        // Add to bill items
        billItems.push({
          itemId: inventoryItem.item._id,
          name: inventoryItem.item.name,
          type: 'serialized-product',
          serialNumber: billItem.serialNumber,
          quantity: 1,
          price: inventoryItem.item.salePrice || 0,
          amount: inventoryItem.item.salePrice || 0
        });
        
        totalAmount += inventoryItem.item.salePrice || 0;
      } else {
        // For generic items, check if quantity is available
        if (inventoryItem.genericQuantity < billItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough quantity for ${inventoryItem.item.name}. Available: ${inventoryItem.genericQuantity}`
          });
        }
        
        // Add to items to update
        itemsToUpdate.push({
          inventoryId: inventoryItem._id,
          type: 'generic',
          quantity: billItem.quantity
        });
        
        // Add to bill items
        billItems.push({
          itemId: inventoryItem.item._id,
          name: inventoryItem.item.name,
          type: 'generic-product',
          quantity: billItem.quantity,
          price: inventoryItem.item.salePrice || 0,
          amount: (inventoryItem.item.salePrice || 0) * billItem.quantity
        });
        
        totalAmount += (inventoryItem.item.salePrice || 0) * billItem.quantity;
      }
    }
    
    // Create the bill
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;
    
    const newBill = new BillModel({
      billNumber,
      customer: customerId,
      workOrder: workOrder._id,
      orderId,
      technician: req.user._id,
      items: billItems,
      totalAmount,
      createdAt: new Date()
    });
    
    await newBill.save();
    
    // Update technician's inventory
    for (const updateItem of itemsToUpdate) {
      const inventory = await TechnicianInventory.findById(updateItem.inventoryId);
      
      if (updateItem.type === 'serialized') {
        // Update serial item status to 'used'
        const serialIndex = inventory.serializedItems.findIndex(
          serial => serial.serialNumber === updateItem.serialNumber
        );
        
        if (serialIndex >= 0) {
          inventory.serializedItems[serialIndex].status = 'used';
        }
      } else {
        // Reduce generic quantity
        inventory.genericQuantity -= updateItem.quantity;
      }
      
      inventory.lastUpdated = new Date();
      inventory.lastUpdatedBy = req.user._id;
      
      await inventory.save();
    }
    
    // Add bill reference to work order
    if (!workOrder.bills) {
      workOrder.bills = [];
    }
    
    workOrder.bills.push(newBill._id);
    
    // Update customer record
    await customer.save();
    
    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        billNumber,
        items: billItems,
        totalAmount,
        customer: {
          name: customer.name,
          phone: customer.phoneNumber,
          address: customer.address
        }
      }
    });
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bill'
    });
  }
};

module.exports = createWorkOrderBill;