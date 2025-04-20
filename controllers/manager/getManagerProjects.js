const Customer = require('../../models/customerModel');
const User = require('../../models/userModel');
const { generateResponse } = require('../../helpers/responseGenerator');

const getManagerProjects = async (req, res) => {
    try {
      const { userId, role } = req.user;
      
      // Check if user is a manager
      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json(generateResponse(false, 'Access denied. Only managers can access this resource.'));
      }
      
      // Get branch filter if provided
      const branchFilter = {};
      if (req.query.branch) {
        branchFilter['branch'] = req.query.branch;
      } else if (role === 'manager') {
        // For managers who don't specify a branch, get their branch
        const manager = await User.findById(userId);
        if (manager && manager.branch) {
          branchFilter['branch'] = manager.branch;
        }
      }

      // Add status filter if provided
const query = {};
if (req.query.status) {
  query['workOrders.status'] = req.query.status;
}

// Combine branch filter with other filters
const finalFilter = { ...branchFilter, ...query };
      
      // Find customers with work orders
      const customers = await Customer.find(finalFilter)
        .populate({
          path: 'workOrders.technician',
          model: 'User',
          select: 'firstName lastName'
        })
        .populate({
          path: 'workOrders.assignedBy',
          model: 'User',
          select: 'firstName lastName'
        })
        .populate({
          path: 'workOrders.statusHistory.updatedBy',
          model: 'User', 
          select: 'firstName lastName'
        })
        .populate({
          path: 'workOrders.bills',
          model: 'Bill',
          populate: {
            path: 'items', // बिल आइटम्स को भी पॉपुलेट करें
          }
        })
        .lean();
      
      // Extract and format work orders
      const allProjects = [];
      
      customers.forEach(customer => {
        if (customer.workOrders && customer.workOrders.length > 0) {
          customer.workOrders.forEach(order => {
            // For each work order, find relevant approval info
            let approvedBy = null;
            let approvedAt = null;
            
            if (order.statusHistory) {
              const approvalEntry = order.statusHistory.find(entry => entry.status === 'approval');
              if (approvalEntry) {
                approvedBy = approvalEntry.updatedBy;
                approvedAt = approvalEntry.updatedAt;
              }
            }
            
            // Find completion date
            let completedAt = null;
            if (order.statusHistory) {
              const completionEntry = order.statusHistory.find(
                entry => entry.status === 'completed' || entry.status === 'pending-approval'
              );
              if (completionEntry) {
                completedAt = completionEntry.updatedAt;
              }
            }
            
            // Get latest status update for in-progress projects
            const latestStatusUpdate = order.statusHistory && order.statusHistory.length > 0 
              ? order.statusHistory[0] 
              : null;
            
            allProjects.push({
              customerId: customer._id,
              customerName: customer.name,
              customerPhone: customer.phoneNumber,
              customerAddress: customer.address,
              orderId: order.orderId,
              projectId: order.projectId,
              projectType: order.projectType,
              status: order.status,
              technician: order.technician,
              assignedBy: order.assignedBy && typeof order.assignedBy === 'object' ? order.assignedBy : { _id: order.assignedBy },
              assignedAt: order.assignedAt,
              initialRemark: order.initialRemark,
              projectCategory: order.projectCategory,
              statusHistory: order.statusHistory ? order.statusHistory.map(entry => ({
                ...entry,
                updatedBy: entry.updatedBy && typeof entry.updatedBy === 'object' ? entry.updatedBy : { _id: entry.updatedBy }
              })) : [],
              billingInfo: order.bills || [],
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              completedAt: completedAt,
              approvedBy: approvedBy,
              approvedAt: approvedAt,
              latestUpdate: latestStatusUpdate
            });
          });
        }
      });
      
      return res.json(generateResponse(true, 'Projects retrieved successfully', allProjects));
    } catch (error) {
      console.error('Error getting manager projects:', error);
      return res.status(500).json(generateResponse(false, 'Server error while fetching projects'));
    }
  }


  module.exports = getManagerProjects;