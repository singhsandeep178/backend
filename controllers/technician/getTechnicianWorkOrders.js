const Customer = require('../../models/customerModel');
const getTechnicianWorkOrders = async (req, res) => {
  try {
    // Only technicians can access their work orders
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can view their work orders.'
      });
    }
   
    // Find all customers with work orders assigned to this technician
    const customers = await Customer.find({
      'workOrders.technician': req.user._id
    })
    .populate('branch', 'name location')
    .populate('workOrders.assignedBy', 'firstName lastName');
   
    // Extract and format work orders
    const workOrders = [];
   
    customers.forEach(customer => {
      // Filter work orders assigned to this technician
      const technicianOrders = customer.workOrders.filter(
        order => order.technician && order.technician.toString() === req.user._id.toString()
      );
     
      // Add customer details to each work order
      technicianOrders.forEach(order => {
        // Find the matching project to get category and initial remark
        const project = customer.projects.find(
          p => p.projectId === order.projectId
        );

        workOrders.push({
          ...order.toObject(),
          customerId: customer._id,
          customerName: customer.name,
          customerPhone: customer.phoneNumber,
          customerWhatsapp: customer.whatsappNumber,  // Added WhatsApp number
          customerEmail: customer.email,
          customerAddress: customer.address,
          branchName: customer.branch ? customer.branch.name : null,
          projectCategory: project ? project.projectCategory : 'New Installation',  // Added project category
          initialRemark: project ? project.initialRemark : '',  // Added initial remark
          assignedByName: order.assignedBy ? 
            `${order.assignedBy.firstName} ${order.assignedBy.lastName}` : 'Admin'  // Added assignedBy name
        });
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
    console.error('Error fetching technician work orders:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work orders'
    });
  }
};
module.exports = getTechnicianWorkOrders;