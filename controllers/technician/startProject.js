const Customer = require('../../models/customerModel');

// Start a project (update status to in-progress)
const startProject = async (req, res) => {
  try {
    const { orderId, customerId } = req.body;
    
    // Only technicians can start projects
    if (req.userRole !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can start projects.'
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
    
    // Find the order
    const orderIndex = customer.workOrders.findIndex(
      order => order.orderId === orderId && order.technician.toString() === req.userId
    );
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found or not assigned to you'
      });
    }
    
    // Update status to in-progress
    customer.workOrders[orderIndex].status = 'in-progress';
    customer.workOrders[orderIndex].startTime = new Date();
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Project started successfully',
      data: customer.workOrders[orderIndex]
    });
  } catch (err) {
    console.error('Error starting project:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while starting project'
    });
  }
};


module.exports = startProject;