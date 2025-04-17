const Customer = require('../../models/customerModel');
const { generateResponse } = require('../../helpers/responseGenerator');

const getWorkOrderDetails = async (req, res) => {
  try {
    const { customerId, orderId } = req.params;
   
    // Find customer and fully populate work order
    const customer = await Customer.findById(customerId)
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
          path: 'items'
        }
      });

    if (!customer) {
      return res.status(404).json(generateResponse(false, 'Customer not found'));
    }
   
    const workOrder = customer.workOrders.find(order => order.orderId === orderId);
    if (!workOrder) {
      return res.status(404).json(generateResponse(false, 'Work order not found'));
    }
   
    // Add customer info to work order
    const workOrderWithCustomerInfo = {
      ...workOrder.toObject(),
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      customerEmail: customer.email,
      customerAddress: customer.address,
      branchName: customer.branch ? customer.branch.name : null
    };
   
    // Add project information
    const project = customer.projects.find(p => p.projectId === workOrder.projectId);
    if (project) {
      workOrderWithCustomerInfo.projectCategory = project.projectCategory || 'New Installation';
      
      // IMPORTANT: Don't overwrite the initialRemark for Repair projects (complaints)
      // Only set project's initialRemark if workOrder doesn't already have an initialRemark
      // or if this is not a Repair project
      if (!workOrder.initialRemark || project.projectCategory !== 'Repair') {
        workOrderWithCustomerInfo.initialRemark = project.initialRemark || '';
      }
      
      // For Repair projects, add complaintRemark that preserves the original complaint
      if (project.projectCategory === 'Repair') {
        // First check if we have an initialRemark in the workOrder itself
        if (workOrder.initialRemark) {
          workOrderWithCustomerInfo.complaintRemark = workOrder.initialRemark;
        } 
        // Look in status history for the initial assignment remark
        else if (workOrder.statusHistory && workOrder.statusHistory.length > 0) {
          // Find the first status entry, which might contain the complaint details
          const reversedHistory = [...workOrder.statusHistory].reverse();
          const firstEntry = reversedHistory.find(entry => 
            entry.status === 'assigned' || 
            (entry.remark && (
              entry.remark.toLowerCase().includes('complaint') || 
              entry.remark.toLowerCase().includes('repair')
            ))
          );
          
          if (firstEntry && firstEntry.remark) {
            workOrderWithCustomerInfo.complaintRemark = firstEntry.remark;
          }
        }
      }
      
      workOrderWithCustomerInfo.projectCreatedAt = project.createdAt; 
    }
     
    // Find who completed the project first (if completed)
    if (workOrder.statusHistory && workOrder.statusHistory.length > 0) {
      console.log("Status history:", JSON.stringify(workOrder.statusHistory));
      
      // Get the latest status change to pending-approval or completed
      const reversedHistory = [...workOrder.statusHistory].reverse();
      const completionHistory = reversedHistory.find(history =>
        history.status === 'pending-approval' || history.status === 'completed'
      );
      
      if (completionHistory) {
        console.log("Found completion history:", JSON.stringify(completionHistory));
        
        if (completionHistory.updatedBy) {
          // Check if updatedBy is populated or not
          if (typeof completionHistory.updatedBy === 'object' && 
              completionHistory.updatedBy.firstName) {
            workOrderWithCustomerInfo.completedBy = 
              `${completionHistory.updatedBy.firstName} ${completionHistory.updatedBy.lastName}`;
            console.log("Set completedBy from populated user:", workOrderWithCustomerInfo.completedBy);
          } 
          // Fallback to current technician if it matches the ID
          else {
            const technicianId = completionHistory.updatedBy.toString();
            if (workOrder.technician && workOrder.technician._id && 
                workOrder.technician._id.toString() === technicianId) {
              workOrderWithCustomerInfo.completedBy = 
                `${workOrder.technician.firstName} ${workOrder.technician.lastName}`;
              console.log("Set completedBy from current technician:", workOrderWithCustomerInfo.completedBy);
            }
          }
        }
      }
      
      // If completedBy is still not set, use the current technician as fallback
      if (!workOrderWithCustomerInfo.completedBy && 
          (workOrder.status === 'pending-approval' || workOrder.status === 'completed') && 
          workOrder.technician && workOrder.technician.firstName) {
        workOrderWithCustomerInfo.completedBy = 
          `${workOrder.technician.firstName} ${workOrder.technician.lastName}`;
        console.log("Set completedBy from fallback:", workOrderWithCustomerInfo.completedBy);
      }
    }

    res.status(200).json(generateResponse(true, 'Work order details retrieved successfully', workOrderWithCustomerInfo));
  } catch (err) {
    console.error('Error fetching work order details:', err);
    res.status(500).json(generateResponse(false, 'Server error while fetching work order details'));
  }
};

module.exports = getWorkOrderDetails;