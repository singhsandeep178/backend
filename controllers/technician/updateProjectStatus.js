const Customer = require('../../models/customerModel');

const updateProjectStatus = async (req, res) => {
    try {
      const { orderId, customerId, status, remarks } = req.body;
      
      // Only technicians can update project status
      if (req.userRole !== 'technician') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only technicians can update project status.'
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
      
      // Update status and add remarks
      customer.workOrders[orderIndex].status = status;
      
      if (remarks) {
        customer.workOrders[orderIndex].remarks = customer.workOrders[orderIndex].remarks || [];
        customer.workOrders[orderIndex].remarks.push({
          text: remarks,
          timestamp: new Date(),
          user: req.userId
        });
      }
      
      await customer.save();
      
      res.status(200).json({
        success: true,
        message: 'Project status updated successfully',
        data: customer.workOrders[orderIndex]
      });
    } catch (err) {
      console.error('Error updating project status:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while updating project status'
      });
    }
  };

module.exports = updateProjectStatus;  