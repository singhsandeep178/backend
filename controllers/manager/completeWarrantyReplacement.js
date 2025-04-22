const WarrantyReplacement = require('../../models/warrantyReplacementModel');

const completeWarrantyReplacement = async (req, res) => {
    try {
      const { replacementId, newSerialNumber, remarks } = req.body;
      
      if (!replacementId || !newSerialNumber || !remarks) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Find the warranty replacement record
      const replacement = await WarrantyReplacement.findById(replacementId);
      
      if (!replacement) {
        return res.status(404).json({
          success: false,
          message: 'Warranty replacement record not found'
        });
      }
      
      // Update the replacement record
      replacement.status = 'replaced';
      replacement.replacementSerialNumber = newSerialNumber;
      replacement.remarks = remarks;
      replacement.approvedBy = req.user._id;
      replacement.approvedAt = new Date();
      
      await replacement.save();
      
      return res.status(200).json({
        success: true,
        message: 'Warranty replacement completed successfully',
        data: replacement
      });
      
    } catch (error) {
      console.error('Error completing warranty replacement:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

module.exports = completeWarrantyReplacement;  