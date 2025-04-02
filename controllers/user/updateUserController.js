const User = require('../../models/userModel');

const updateUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Find the user to update
    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check permissions
    if (req.userRole === 'admin') {
      // Admin can update any user
    } else if (req.userRole === 'manager') {
      // Manager can only update technicians in their branch
      if (userToUpdate.role !== 'technician') {
        return res.status(403).json({
          success: false,
          message: 'You can only update technicians'
        });
      }
      
      if (userToUpdate.branch.toString() !== req.userBranch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update technicians from your branch'
        });
      }
      
      // Always use manager's branch when updating
      updates.branch = req.userBranch;
    } else {
      // Other roles cannot update users
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }
    
    // Don't allow changing role
    delete updates.role;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

module.exports = updateUserController;