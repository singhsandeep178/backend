const Customer = require('../../models/customerModel');

const updateWorkOrderStatus = async (req, res) => {
  try {
    const { customerId, orderId, status } = req.body;
    
    // Validate required fields
    if (!customerId || !orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, order ID, and status are required'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find the work order
    const workOrder = customer.workOrders.find(order => order.orderId === orderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    
    // Authorization check
    // For technicians: can only update their assigned work orders
    // For managers/admins: can update any work order in their branch
    if (req.user.role === 'technician') {
      if (!workOrder.technician || workOrder.technician.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this work order'
        });
      }
      
      // Technicians can only update to 'in-progress' or 'completed'
      if (status === 'pending' || status === 'assigned') {
        return res.status(403).json({
          success: false,
          message: 'Technicians can only update status to in-progress or completed'
        });
      }
    } else {
      // For managers, check branch access
      if (req.user.role === 'manager' && customer.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update work orders from other branches'
        });
      }
    }
    
    // Update work order status
    workOrder.status = status;
    workOrder.updatedAt = new Date();
    
    // Save the changes
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Work order status updated successfully',
      data: workOrder
    });
  } catch (err) {
    console.error('Error updating work order status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while updating work order status'
    });
  }
};

module.exports = updateWorkOrderStatus;