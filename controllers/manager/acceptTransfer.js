const Customer = require('../../models/customerModel');
const { generateResponse } = require('../../helpers/responseGenerator');

const acceptTransfer = async (req, res) => {
  try {
    const { customerId, orderId, remark } = req.body;
    
    // Validate inputs
    if (!customerId || !orderId) {
      return res.status(400).json(generateResponse(false, 'Customer ID and Order ID are required'));
    }
    
    if (!remark || remark.trim().split(/\s+/).filter(word => word.length > 0).length < 5) {
      return res.status(400).json(generateResponse(false, 'A meaningful remark (minimum 5 words) is required'));
    }
    
    // Find the customer and work order
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json(generateResponse(false, 'Customer not found'));
    }
    
    let workOrder;

// Try using the id method first
workOrder = customer.workOrders.id(orderId);

// If that fails, try to find it manually in the array
if (!workOrder) {
  workOrder = customer.workOrders.find(wo => 
    wo.orderId === orderId || 
    wo._id.toString() === orderId
  );
}

if (!workOrder) {
  return res.status(404).json(generateResponse(false, 'Work order not found'));
}

console.log('Looking for workOrder with ID:', orderId);
console.log('Customer workOrders:', customer.workOrders.map(wo => ({
  _id: wo._id,
  orderId: wo.orderId
})));
    
    // Verify that work order is in transferring status
    if (workOrder.status !== 'transferring') {
      return res.status(400).json(generateResponse(false, 'Work order is not in transferring status'));
    }
    
    // Change status to pending (reset it)
    workOrder.status = 'transferred';
    
    // Add status history entry
    workOrder.statusHistory.unshift({
      status: 'transferred',
      remark: remark,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    // Clear the technician assignment
    workOrder.technician = null;
    workOrder.assignedBy = null;
    workOrder.assignedAt = null;
    
    // Save the customer
    await customer.save();
    
    res.status(200).json(generateResponse(true, 'Transfer request accepted successfully', workOrder));
  } catch (err) {
    console.error('Error accepting transfer request:', err);
    res.status(500).json(generateResponse(false, 'Server error while accepting transfer request'));
  }
};

module.exports = acceptTransfer;