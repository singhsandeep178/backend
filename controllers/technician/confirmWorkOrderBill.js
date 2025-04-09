// controllers/technician/confirmWorkOrderBill.js
const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const BillModel = require('../../models/billModel');

const confirmWorkOrderBill = async (req, res) => {
  try {
    // Only technicians can confirm bills
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can confirm bills.'
      });
    }
    
    const { billId, paymentMethod, transactionId = null } = req.body;
    
    // Find the bill
    const bill = await BillModel.findById(billId);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }
    
    // Check if technician is the one who created the bill
    if (bill.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm this bill'
      });
    }
    
    // Update the bill with payment details
    bill.paymentMethod = paymentMethod;
    bill.paymentStatus = 'paid';
    bill.transactionId = transactionId;
    bill.paidAt = new Date();
    
    await bill.save();
    
    // Update technician's inventory by marking items as used
    for (const item of bill.items) {
      const inventory = await TechnicianInventory.findOne({
        technician: req.user._id,
        item: item.itemId
      });
      
      if (inventory) {
        if (item.type === 'serialized-product' && item.serialNumber) {
          // For serialized items, mark as used
          const serialIndex = inventory.serializedItems.findIndex(
            serial => serial.serialNumber === item.serialNumber
          );
          
          if (serialIndex >= 0) {
            inventory.serializedItems[serialIndex].status = 'used';
          }
        } else if (item.type === 'generic-product') {
          // For generic items, reduce quantity
          inventory.genericQuantity -= item.quantity;
        }
        
        inventory.lastUpdated = new Date();
        inventory.lastUpdatedBy = req.user._id;
        
        await inventory.save();
      }
    }
    
    // Find the customer and work order
    const customer = await Customer.findById(bill.customer);
if (customer) {
  // workOrder को सही तरीके से find करें
  const workOrder = customer.workOrders.find(order => order.orderId === bill.orderId);
  
  if (workOrder) {
    // Add the billing info to work order
    if (!workOrder.billingInfo) {
      workOrder.billingInfo = [];
    }
    
    workOrder.billingInfo.push({
      billId: bill._id,
      billNumber: bill.billNumber,
      amount: bill.totalAmount,
      paymentMethod,
      transactionId,
      paidAt: new Date()
    });

    // Add to status history too
  if (!workOrder.statusHistory) {
    workOrder.statusHistory = [];
  }
  
  workOrder.statusHistory.push({
    status: 'payment',
    remark: `Payment of ₹${bill.totalAmount.toFixed(2)} received via ${paymentMethod}`,
    updatedAt: new Date(),
    updatedBy: req.user._id
  });
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        billNumber: bill.billNumber,
        paymentMethod,
        amount: bill.totalAmount,
        workOrder: workOrder.toObject ? workOrder.toObject() : workOrder // Include workOrder in response
      }
    });
    return; // Function को यहीं terminate करें
  }
}
  } catch (err) {
    console.error('Error confirming bill:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming bill'
    });
  }
};

module.exports = confirmWorkOrderBill;