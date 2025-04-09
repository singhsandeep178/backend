// controllers/technician/getWorkOrderDetails.js
const Customer = require('../../models/customerModel');

const getWorkOrderDetails = async (req, res) => {
  try {
    const { customerId, orderId } = req.params;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const workOrder = customer.workOrders.find(order => order.orderId === orderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    
    // Add customer info to work order
    const workOrderWithCustomerInfo = {
      ...workOrder.toObject(),
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      customerEmail: customer.email,
      customerAddress: customer.address
    };
    
    res.status(200).json({
      success: true,
      data: workOrderWithCustomerInfo
    });
  } catch (err) {
    console.error('Error fetching work order details:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work order details'
    });
  }
};

module.exports = getWorkOrderDetails;