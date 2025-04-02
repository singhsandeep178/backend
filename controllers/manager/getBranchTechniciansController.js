const User = require('../../models/userModel');

const getBranchTechniciansController = async (req, res) => {
  try {
    // Check if user is manager or admin
    if (req.userRole !== 'manager' && req.userRole !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    // If user is manager, they can only see technicians from their branch
    let query = { role: 'technician' };
    
    if (req.userRole === 'manager') {
      // Managers can only see technicians from their branch
      query.branch = req.userBranch; // Assuming middleware sets userBranch
    }
    
    const technicians = await User.find(query)
      .select('-password')
      .populate('branch', 'name location')
      .sort('-createdAt');
    
    res.status(200).json({
      message: 'Technicians fetched successfully',
      error: false,
      success: true,
      data: technicians
    });
  } catch (err) {
    console.error('Error in getBranchTechnicians:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = getBranchTechniciansController;