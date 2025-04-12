const Customer = require('../../models/customerModel');
const generateOrderId = require('../../helpers/generateOrderId');

// Create a new work order for a customer
const createWorkOrder = async (req, res) => {
  try {
    const { customerId, projectType, projectCategory, initialRemark } = req.body;
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if user has permission
    if (req.user.role !== 'admin' && customer.branch.toString() !== req.user.branch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add work order for this customer'
      });
    }
    
    // Generate project ID and order ID
    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    const orderId = await generateOrderId(); // Custom function to generate unique order IDs
    
    // Default project category to "New Installation" if not provided
    const finalProjectCategory = projectCategory || 'New Installation';
    
    // Add project to customer's projects array
    const newProject = {
      projectId,
      projectType,
      projectCategory: finalProjectCategory,
      initialRemark,
      createdAt: new Date()
    };
    
    customer.projects.push(newProject);
    
    // Create work order
    const workOrder = {
      orderId,
      projectId,
      projectType,
      projectCategory: finalProjectCategory,
      status: 'pending',
      createdAt: new Date()
    };
    
    customer.workOrders.push(workOrder);
    await customer.save();
    
    res.status(201).json({
      success: true,
      data: {
        customer,
        project: newProject,
        workOrder
      }
    });
  } catch (err) {
    console.error('Error creating work order:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating work order'
    });
  }
};

module.exports = createWorkOrder;