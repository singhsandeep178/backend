const Customer = require('../../models/customerModel');

const createCustomer = async (req, res) => {
    try {
      // Check if phone number already exists
      const existingCustomer = await Customer.findOne({ 
        phoneNumber: req.body.phoneNumber 
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'A customer with this phone number already exists'
        });
      }
      
      // Set branch based on user role
      let branch = req.body.branch;
      if (req.user.role !== 'admin') {
        branch = req.user.branch;
      }
      
      // Create new customer
      const customer = await Customer.create({
        ...req.body,
        branch,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (err) {
      console.error('Error creating customer:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while creating customer'
      });
    }
  };

  module.exports = createCustomer;