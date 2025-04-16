const Customer = require('../../models/customerModel');
const getAllWorkOrders = async (req, res) => {
    try {
      // Filter options
      const filter = {};
      if (req.query.status) {
        filter['workOrders.status'] = req.query.status;
      }
     
      // Branch access control
      if (req.user.role !== 'admin') {
        filter.branch = req.user.branch;
      } else if (req.query.branch) {
        filter.branch = req.query.branch;
      }
     
      // Get customers with work orders
      const customers = await Customer.find(filter)
        .populate('branch', 'name')
        .populate('workOrders.technician', 'firstName lastName')
        .populate('workOrders.assignedBy', 'firstName lastName');
     
      // Extract all work orders with customer info
      const workOrders = customers.flatMap(customer => {
        return customer.workOrders.map(order => {
          // Create the basic order object with all fields
          const orderObj = {
            ...order.toObject(),
            customerName: customer.name,
            customerPhone: customer.phoneNumber,
            customerEmail: customer.email,
            branchName: customer.branch ? customer.branch.name : null,
            customerId: customer._id,
            initialRemark: order.initialRemark
          };
          
          // If projectCategory is missing, try to find it from the matching project
          if (!orderObj.projectCategory && order.projectId) {
            const matchingProject = customer.projects.find(p => p.projectId === order.projectId);
            if (matchingProject) {
              orderObj.projectCategory = matchingProject.projectCategory || 'New Installation';
            } else {
              // Default to 'New Installation' if no matching project is found
              orderObj.projectCategory = 'New Installation';
            }
          }
          
          return orderObj;
        });
      });
     
      // Sort by creation date (newest first)
      workOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
     
      res.status(200).json({
        success: true,
        count: workOrders.length,
        data: workOrders
      });
    } catch (err) {
      console.error('Error fetching work orders:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching work orders'
      });
    }
  };
module.exports = getAllWorkOrders;