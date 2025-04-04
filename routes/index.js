const express = require('express');
const router = express.Router();
const authToken = require('../middleware/authToken');
const { loginController } = require('../controllers/user/loginController');
const getAdminUsersController = require('../controllers/admin/getAdminUsersController');
const addAdminUserController = require('../controllers/admin/addAdminUserController');
const getManagersController = require('../controllers/admin/getManagersController');
const addManagerController = require('../controllers/admin/addManagerController');
const getTechniciansController = require('../controllers/admin/getTechniciansController');
const addTechnicianController = require('../controllers/admin/addTechnicianController');
const getBranchesController = require('../controllers/admin/getBranchesController');
const addBranchController = require('../controllers/admin/addBranchController');
const updateUserStatusController = require('../controllers/admin/updateUserStatusController');
const search = require('../controllers/Lead/search');
const getAllLeads = require('../controllers/Lead/getAllLeads');
const createLead = require('../controllers/Lead/createLead');
const getLead = require('../controllers/Lead/getLead');
const updateLead = require('../controllers/Lead/updateLead');
const addRemark = require('../controllers/Lead/addRemark');
const convertToCustomer = require('../controllers/Lead/convertToCustomer');
const getAllCustomers = require('../controllers/customer/getAllCustomers');
const createCustomer = require('../controllers/customer/createCustomer');
const getCustomer = require('../controllers/customer/getCustomer');
const updateCustomer = require('../controllers/customer/updateCustomer');
const getAllInventory = require('../controllers/inventory/getAllInventory');
const getInventory = require('../controllers/inventory/getInventory');
const createInventory = require('../controllers/inventory/createInventory');
const stockAdd = require('../controllers/inventory/stockAdd');
const updateInventory = require('../controllers/inventory/updateInventory');
const deleteInventory = require('../controllers/inventory/deleteInventory');
const checkSerialNumber = require('../controllers/inventory/checkSerialNumber');
const getBranchTechniciansController = require('../controllers/manager/getBranchTechniciansController');
const managerAddTechnicianController = require('../controllers/manager/managerAddTechnicianController');
const getUserController = require('../controllers/user/getUserController');
const updateUserController = require('../controllers/user/updateUserController');
const deleteUserController = require('../controllers/user/deleteUserController');
const getInventoryByType = require('../controllers/inventory/getInventoryByType');
const getNewBranchManagersController = require('../controllers/manager/getNewBranchManagersController');
const checkManagerStatusController = require('../controllers/manager/checkManagerStatusController');
const initiateTransferController = require('../controllers/manager/initiateTransferController');
const acceptTransferController = require('../controllers/manager/acceptTransferController');
const rejectTransferController = require('../controllers/manager/rejectTransferController');
const getRejectedTransfersController = require('../controllers/manager/getRejectedTransfersController');


// Login 
router.post("/login", loginController);

// User
router.get("/get-user/:id", authToken, getUserController);
router.post("/update-user/:id", authToken, updateUserController);
router.delete("/delete-user/:id", authToken, deleteUserController);

// Admin
router.get("/get-admins", authToken, getAdminUsersController);
router.post("/add-admins", authToken, addAdminUserController);
router.get("/get-managers", authToken, getManagersController);
router.post("/add-managers", authToken, addManagerController);
router.get("/get-technicians", authToken, getTechniciansController);
router.post("/add-technicians", authToken, addTechnicianController);
router.get("/get-branches", authToken, getBranchesController);
router.post("/add-branches", authToken, addBranchController);
router.post("/user-status", authToken, updateUserStatusController);

// Manager
router.get("/manager-get-technician", authToken, getBranchTechniciansController);
router.post("/manager-add-technician", authToken, managerAddTechnicianController);
router.get("/new-managers", authToken, getNewBranchManagersController);
router.get("/manager-status", authToken, checkManagerStatusController);
router.post("/initiate-transfer", authToken, initiateTransferController);
router.post("/accept-transfer/:transferId", authToken, acceptTransferController);
router.post("/reject-transfer/:transferId", authToken, rejectTransferController);
router.get("/get-rejected-transfers", authToken, getRejectedTransfersController);


// Lead
router.get("/search", authToken, search);
router.get("/get-all-leads", authToken, getAllLeads);
router.post("/create-Lead", authToken, createLead);
router.get("/get-single-lead/:id", authToken, getLead);
router.post("/update-lead/:id", authToken, updateLead);
router.post("/lead-remarks/:id", authToken, addRemark);
router.post("/lead-convert/:id", authToken, convertToCustomer)

// Customer
router.get("/get-all-customers", authToken, getAllCustomers);
router.post("/create-customer", authToken, createCustomer);
router.get("/get-single-customer/:id", authToken, getCustomer);
router.post("/update-customer/:id", authToken, updateCustomer);

// Inventory
router.get("/get-all-inventory", authToken, getAllInventory);
router.get("/get-single-inventory/:id", authToken, getInventory);
router.post("/create-inventory", authToken, createInventory);
router.post("/add-stock", authToken, stockAdd);
router.post("/update-inventory/:id", authToken, updateInventory);
router.post("/delete-inventory/:id", authToken, deleteInventory);
router.get("/check-serial/:serialNumber", authToken, checkSerialNumber);
router.get("/inventory-by-type/:type", authToken, getInventoryByType);

module.exports = router;
