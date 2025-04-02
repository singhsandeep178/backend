const Branch = require('../../models/branchModel');

const getBranchesController = async (req, res) => {
    try {
      // Check if user is admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          message: 'Permission denied',
          error: true,
          success: false
        });
      }
      
      const branches = await Branch.find().sort('-createdAt');
      
      res.status(200).json({
        message: 'Branches fetched successfully',
        error: false,
        success: true,
        data: branches
      });
    } catch (err) {
      console.error('Error in getBranches:', err);
      res.status(500).json({
        message: err.message || 'Server error',
        error: true,
        success: false
      });
    }
  };


module.exports = getBranchesController;  