const User = require('../../models/userModel');

const addManagerController = async (req, res) => {
    try {
      // Check if user is admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          message: 'Permission denied',
          error: true,
          success: false
        });
      }
      
      const { firstName, lastName, username, email, password, phone, branch, location } = req.body;
      
      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });
      
      if (existingUser) {
        return res.status(400).json({
          message: 'Username or email already exists',
          error: true,
          success: false
        });
      }
      
      // Create new manager
      const newManager = new User({
        firstName,
        lastName,
        username,
        email,
        password,
        phone,
        role: 'manager',
        branch,
        location
      });
      
      await newManager.save();
      
      // Remove password from response
      const managerData = newManager.toObject();
      delete managerData.password;
      
      res.status(201).json({
        message: 'Manager added successfully',
        error: false,
        success: true,
        data: managerData
      });
    } catch (err) {
      console.error('Error in addManager:', err);
      res.status(500).json({
        message: err.message || 'Server error',
        error: true,
        success: false
      });
    }
  };

module.exports = addManagerController;  