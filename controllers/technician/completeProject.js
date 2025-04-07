const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');

const completeProject = async (req, res) => {
    try {
      const { 
        orderId, 
        customerId, 
        products, 
        total, 
        paymentMethod, 
        paymentStatus 
      } = req.body;
      
      // Only technicians can complete projects
      if (req.userRole !== 'technician') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only technicians can complete projects.'
        });
      }
      
      // Find the customer and work order
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      
      // Find the order
      const orderIndex = customer.workOrders.findIndex(
        order => order.orderId === orderId && order.technician.toString() === req.userId
      );
      
      if (orderIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found or not assigned to you'
        });
      }
      
      // Update inventory for each product
      for (const product of products) {
        // Get the technician's inventory for this item
        let techInventory = await TechnicianInventory.findOne({
          technician: req.userId,
          item: product.itemId
        });
        
        if (!techInventory) {
          return res.status(404).json({
            success: false,
            message: `Inventory item ${product.itemName} not found in your inventory`
          });
        }
        
        // Update serialized items if applicable
        if (product.serialNumbers && product.serialNumbers.length > 0) {
          // Verify each serial number exists in technician's inventory
          for (const serialNumber of product.serialNumbers) {
            const serialIndex = techInventory.serializedItems.findIndex(
              si => si.serialNumber === serialNumber && si.status === 'active'
            );
            
            if (serialIndex === -1) {
              return res.status(400).json({
                success: false,
                message: `Serial number ${serialNumber} not found in your inventory or already used`
              });
            }
            
            // Mark as used in technician inventory
            techInventory.serializedItems[serialIndex].status = 'used';
            techInventory.serializedItems[serialIndex].usedAt = new Date();
            techInventory.serializedItems[serialIndex].usedIn = {
              customerId,
              orderId
            };
          }
        }
        
        // Update generic quantity if applicable
        if (product.type !== 'serialized-product' && product.quantity > 0) {
          if (techInventory.genericQuantity < product.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient quantity of ${product.itemName} in your inventory`
            });
          }
          
          // Reduce generic quantity
          techInventory.genericQuantity -= product.quantity;
        }
        
        await techInventory.save();
      }
      
      // Create invoice
      const invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        items: products.map(product => ({
          itemId: product.itemId,
          name: product.itemName,
          quantity: product.quantity,
          unitPrice: product.price,
          amount: product.price * product.quantity,
          serialNumbers: product.serialNumbers || []
        })),
        totalAmount: total,
        paymentMethod,
        amountReceived: paymentStatus.amountReceived,
        balance: total - paymentStatus.amountReceived,
        transactionId: paymentStatus.transactionId,
        isComplete: paymentStatus.isComplete,
        timestamp: new Date()
      };
      
      // Update order with invoice and complete status
      customer.workOrders[orderIndex].status = 'completed';
      customer.workOrders[orderIndex].completedAt = new Date();
      customer.workOrders[orderIndex].invoice = invoice;
      
      await customer.save();
      
      res.status(200).json({
        success: true,
        message: 'Project completed successfully',
        data: {
          invoice,
          workOrder: customer.workOrders[orderIndex]
        }
      });
    } catch (err) {
      console.error('Error completing project:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while completing project'
      });
    }
  };

module.exports = completeProject;  