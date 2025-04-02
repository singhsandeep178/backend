const Lead = require('../../models/leadModel');
const Customer = require('../../models/customerModel');

const createLead = async (req, res) => {
    try {
      // Check if phone number already exists in non-converted leads
      const existingLead = await Lead.findOne({ 
        phoneNumber: req.body.phoneNumber,
        isConverted: false 
      });
      
      if (existingLead) {
        return res.status(400).json({
          success: false,
          message: 'A lead with this phone number already exists'
        });
      }
      
      // Check if phone number exists in customers
      const existingCustomer = await Customer.findOne({ 
        phoneNumber: req.body.phoneNumber 
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'A customer with this phone number already exists',
          isCustomer: true,
          customerId: existingCustomer._id
        });
      }
      
      // Set branch based on user role
      let branch = req.body.branch;
      if (req.user.role !== 'admin') {
        // Non-admin users can only create leads for their own branch
        branch = req.user.branch;
      }
      
      // Create new lead
      const lead = await Lead.create({
        ...req.body,
        branch,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        data: lead
      });
    } catch (err) {
      console.error('Error creating lead:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while creating lead'
      });
    }
  };

module.exports = createLead;  